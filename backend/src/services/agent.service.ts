import { supabase } from '../config/supabase.js'
import { config } from '../config/index.js'
import { BadRequestError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

const KESTRA_NAMESPACE = 'leadtracker.ai'
const KESTRA_FLOW_ID = 'conversational-agent'

interface KestrarExecutionResponse {
  id: string
  state: { current: string }
  taskRunList?: Array<{
    taskId: string
    outputs?: {
      textOutput?: string
    }
  }>
}

interface AgentResponse {
  message: string
  executionId: string
}

class AgentService {
  private getAuthHeader(): string {
    if (config.kestra.username && config.kestra.password) {
      return `Basic ${Buffer.from(`${config.kestra.username}:${config.kestra.password}`).toString('base64')}`
    }
    return ''
  }

  private getBaseUrl(): string {
    if (!config.kestra.url) {
      throw new BadRequestError('Kestra não está configurado. Preencha KESTRA_URL no .env')
    }
    return config.kestra.url.replace(/\/$/, '')
  }

  private async gatherTenantContext(tenantId: string): Promise<string> {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const [
        leadsResult,
        leadsThisMonthResult,
        leadsByStageResult,
        messagesThisWeekResult,
        sdrSessionsResult,
        recentLeadsResult,
        recentActivityResult,
      ] = await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),

        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfMonth.toISOString()),

        supabase
          .from('leads')
          .select('stage_id, kanban_stages(name)')
          .eq('tenant_id', tenantId),

        supabase
          .from('messages')
          .select('direction, leads!inner(tenant_id)', { count: 'exact' })
          .eq('leads.tenant_id', tenantId)
          .gte('created_at', startOfWeek.toISOString()),

        supabase
          .from('sdr_sessions')
          .select('status')
          .eq('tenant_id', tenantId),

        supabase
          .from('leads')
          .select('name, phone, source, created_at, kanban_stages(name)')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('lead_history')
          .select('action, metadata, created_at, leads!inner(name, tenant_id)')
          .eq('leads.tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const stageCount: Record<string, number> = {}
      if (leadsByStageResult.data) {
        for (const lead of leadsByStageResult.data) {
          const stage = (lead.kanban_stages as unknown as { name: string } | null)?.name || 'Sem estágio'
          stageCount[stage] = (stageCount[stage] || 0) + 1
        }
      }

      const sdrStats = { active: 0, qualified: 0, disqualified: 0, completed: 0 }
      if (sdrSessionsResult.data) {
        for (const s of sdrSessionsResult.data) {
          if (s.status in sdrStats) sdrStats[s.status as keyof typeof sdrStats]++
        }
      }

      const msgThisWeek = messagesThisWeekResult.data || []
      const inbound = msgThisWeek.filter((m: any) => m.direction === 'inbound').length
      const outbound = msgThisWeek.filter((m: any) => m.direction === 'outbound').length

      const recentLeads = (recentLeadsResult.data || []).map((l: any) => ({
        nome: l.name,
        telefone: l.phone,
        origem: l.source,
        estagio: l.kanban_stages?.name || 'Sem estágio',
        criado_em: l.created_at,
      }))

      const recentActivity = (recentActivityResult.data || []).map((h: any) => ({
        acao: h.action,
        lead: (h.leads as any)?.name || 'Desconhecido',
        data: h.created_at,
        detalhes: (h.metadata as any)?.preview || '',
      }))

      const context = {
        data_atual: now.toISOString().split('T')[0],
        resumo: {
          total_leads: leadsResult.count || 0,
          leads_este_mes: leadsThisMonthResult.count || 0,
          msgs_esta_semana: { recebidas: inbound, enviadas: outbound },
        },
        pipeline: stageCount,
        sdr_agente: sdrStats,
        ultimos_leads: recentLeads,
        atividade_recente: recentActivity,
      }

      return JSON.stringify(context, null, 2)
    } catch (error) {
      logger.error('Failed to gather tenant context', { error, tenantId })
      return '{}'
    }
  }

  async chat(
    userMessage: string,
    sessionId: string,
    tenantId: string,
    userId: string
  ): Promise<AgentResponse> {
    const baseUrl = this.getBaseUrl()

    const executeUrl = `${baseUrl}/api/v1/executions/${KESTRA_NAMESPACE}/${KESTRA_FLOW_ID}`

    logger.info('Triggering Kestra agent flow', { sessionId, tenantId })

    const dataContext = await this.gatherTenantContext(tenantId)

    const formData = new FormData()
    formData.append('user_message', userMessage)
    formData.append('session_id', sessionId)
    formData.append('tenant_id', tenantId)
    formData.append('user_id', userId)
    formData.append('api_key', config.kestra.aiApiKey)
    formData.append('data_context', dataContext)

    const headers: HeadersInit = {}
    const auth = this.getAuthHeader()
    if (auth) headers['Authorization'] = auth

    const response = await fetch(executeUrl, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Kestra execution failed', { status: response.status, error: errorText })
      throw new BadRequestError('Falha ao executar o agente. Tente novamente.')
    }

    const execution: KestrarExecutionResponse = await response.json()
    const executionId = execution.id

    // Poll for completion (max 60 seconds)
    const agentOutput = await this.waitForCompletion(executionId)

    return {
      message: agentOutput,
      executionId,
    }
  }

  /**
   * Poll Kestra execution until completion
   */
  private async waitForCompletion(executionId: string, maxWaitMs = 60000): Promise<string> {
    const baseUrl = this.getBaseUrl()
    const pollUrl = `${baseUrl}/api/v1/executions/${executionId}`
    const pollInterval = 1000
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const pollHeaders: HeadersInit = {}
      const pollAuth = this.getAuthHeader()
      if (pollAuth) pollHeaders['Authorization'] = pollAuth

      const response = await fetch(pollUrl, {
        headers: pollHeaders,
      })

      if (!response.ok) {
        logger.error('Failed to poll Kestra execution', { executionId, status: response.status })
        throw new BadRequestError('Erro ao consultar status do agente')
      }

      const execution: KestrarExecutionResponse = await response.json()
      const state = execution.state.current

      if (state === 'SUCCESS') {
        const taskRun = execution.taskRunList?.find(t => t.taskId === 'agent_task')
        return taskRun?.outputs?.textOutput || 'Resposta do agente não disponível.'
      }

      if (state === 'FAILED' || state === 'KILLED') {
        logger.error('Kestra execution failed', { executionId, state })
        throw new BadRequestError('O agente encontrou um erro ao processar sua mensagem.')
      }

      // RUNNING, CREATED, etc. — keep polling
    }

    throw new BadRequestError('Tempo limite excedido. O agente demorou muito para responder.')
  }

  /**
   * Check if Kestra is configured and reachable
   */
  async healthCheck(): Promise<{ configured: boolean; reachable: boolean }> {
    if (!config.kestra.url) {
      return { configured: false, reachable: false }
    }

    try {
      const baseUrl = this.getBaseUrl()
      const healthHeaders: HeadersInit = {}
      const healthAuth = this.getAuthHeader()
      if (healthAuth) healthHeaders['Authorization'] = healthAuth

      const response = await fetch(`${baseUrl}/api/v1/flows`, {
        headers: healthHeaders,
      })
      return { configured: true, reachable: response.ok }
    } catch {
      return { configured: true, reachable: false }
    }
  }
}

export const agentService = new AgentService()
