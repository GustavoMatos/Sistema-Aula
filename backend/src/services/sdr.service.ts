import { supabase } from '../config/supabase.js'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'
import { sendMeetingInviteEmail } from './email.service.js'

const KESTRA_NAMESPACE = 'leadtracker.ai'
const KESTRA_FLOW_ID = 'sdr-qualifying-agent'

const STAGE_NAMES = {
  NOVO_LEAD: 'Novo Lead',
  PRIMEIRO_CONTATO: 'Primeiro Contato',
  QUALIFICACAO: 'Qualificação',
  REUNIAO_AGENDADA: 'Reunião Agendada',
  DESCARTADO: 'Descartado',
} as const

interface SdrSession {
  id: string
  tenant_id: string
  lead_id: string
  status: string
  collected_data: Record<string, unknown>
  advisor_email: string | null
  meeting_scheduled_at: string | null
  message_count: number
  kestra_session_id: string | null
}

interface SdrAgentResponse {
  message: string
  action: string
  collected_data?: Record<string, unknown>
  qualification_status?: string
  meeting_suggestion?: string
}

class SdrService {
  private getAuthHeader(): string {
    if (config.kestra.username && config.kestra.password) {
      return `Basic ${Buffer.from(`${config.kestra.username}:${config.kestra.password}`).toString('base64')}`
    }
    return ''
  }

  private getBaseUrl(): string {
    return config.kestra.url.replace(/\/$/, '')
  }

  async startSession(leadId: string, tenantId: string): Promise<void> {
    if (!config.kestra.url || !config.kestra.aiApiKey) {
      logger.warn('Kestra not configured — skipping SDR session')
      return
    }

    const { data: existing } = await supabase
      .from('sdr_sessions')
      .select('id, status')
      .eq('lead_id', leadId)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        logger.info('SDR session already active', { leadId })
        return
      }
      if (existing.status === 'completed' || existing.status === 'disqualified') {
        const newSessionId = `sdr-${leadId}-${Date.now()}`
        await supabase
          .from('sdr_sessions')
          .update({
            status: 'active',
            message_count: 0,
            collected_data: {},
            kestra_session_id: newSessionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        logger.info('SDR session reactivated for new lead', { leadId, newSessionId })
      } else {
        logger.info('SDR session exists with status', { leadId, status: existing.status })
        return
      }
    }

    const sessionId = `sdr-${leadId}`

    const { error } = await supabase
      .from('sdr_sessions')
      .insert({
        tenant_id: tenantId,
        lead_id: leadId,
        status: 'active',
        kestra_session_id: sessionId,
        collected_data: {},
      })

    if (error) {
      logger.error('Failed to create SDR session', { error, leadId })
      return
    }

    logger.info('SDR session started', { leadId, sessionId })

    const { data: lead } = await supabase
      .from('leads')
      .select('name, phone')
      .eq('id', leadId)
      .single()

    const agentResponse = await this.triggerKestraFlow(
      sessionId,
      'Ola, gostaria de saber mais sobre investimentos',
      leadId,
      lead?.name || 'Cliente',
      lead?.phone || '',
      '{}',
      STAGE_NAMES.PRIMEIRO_CONTATO,
      tenantId
    )

    if (agentResponse) {
      await this.handleAgentResponse(leadId, tenantId, null, agentResponse)
    }
  }

  async processIncomingMessage(leadId: string, tenantId: string, messageContent: string): Promise<void> {
    const { data: session } = await supabase
      .from('sdr_sessions')
      .select('*')
      .eq('lead_id', leadId)
      .single()

    if (!session) return

    if (session.status !== 'active') {
      if (session.status === 'completed' || session.status === 'disqualified') {
        const newSessionId = `sdr-${leadId}-${Date.now()}`
        await supabase
          .from('sdr_sessions')
          .update({
            status: 'active',
            message_count: 0,
            collected_data: {},
            kestra_session_id: newSessionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id)
        session.status = 'active'
        session.message_count = 0
        session.collected_data = {}
        session.kestra_session_id = newSessionId
        logger.info('SDR session reactivated', { leadId, newSessionId })
      } else {
        return
      }
    }

    const sdrSession = session as SdrSession

    await supabase
      .from('sdr_sessions')
      .update({
        message_count: sdrSession.message_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sdrSession.id)

    const { data: lead } = await supabase
      .from('leads')
      .select('name, phone, stage_id, kanban_stages(name)')
      .eq('id', leadId)
      .single()

    const currentStage = (lead as any)?.kanban_stages?.name || STAGE_NAMES.PRIMEIRO_CONTATO

    const agentResponse = await this.triggerKestraFlow(
      sdrSession.kestra_session_id || `sdr-${leadId}`,
      messageContent,
      leadId,
      lead?.name || 'Cliente',
      lead?.phone || '',
      JSON.stringify(sdrSession.collected_data),
      currentStage,
      tenantId
    )

    if (!agentResponse) return

    await this.handleAgentResponse(leadId, tenantId, sdrSession, agentResponse)
  }

  private async handleAgentResponse(
    leadId: string,
    tenantId: string,
    session: SdrSession | null,
    response: SdrAgentResponse
  ): Promise<void> {
    if (session && response.collected_data && Object.keys(response.collected_data).length > 0) {
      const merged = { ...session.collected_data, ...response.collected_data }
      await supabase
        .from('sdr_sessions')
        .update({ collected_data: merged, updated_at: new Date().toISOString() })
        .eq('id', session.id)
    }

    if (response.action === 'qualify' && session) {
      await this.handleQualification(leadId, tenantId, session, response)
    } else if (response.action === 'disqualify' && session) {
      await supabase
        .from('sdr_sessions')
        .update({ status: 'disqualified', updated_at: new Date().toISOString() })
        .eq('id', session.id)

      logger.info('Lead disqualified by SDR', { leadId })
    }
  }

  private async handleQualification(
    leadId: string,
    _tenantId: string,
    session: SdrSession,
    _response: SdrAgentResponse
  ): Promise<void> {
    const meetingDate = new Date()
    meetingDate.setDate(meetingDate.getDate() + 1)
    meetingDate.setHours(10, 0, 0, 0)
    if (meetingDate.getDay() === 0) meetingDate.setDate(meetingDate.getDate() + 1)
    if (meetingDate.getDay() === 6) meetingDate.setDate(meetingDate.getDate() + 2)

    const advisorEmail = session.advisor_email || config.sdr.defaultAdvisorEmail

    await supabase
      .from('sdr_sessions')
      .update({
        status: 'qualified',
        meeting_scheduled_at: meetingDate.toISOString(),
        advisor_email: advisorEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    const { data: lead } = await supabase
      .from('leads')
      .select('name, phone')
      .eq('id', leadId)
      .single()

    if (advisorEmail && lead) {
      const collectedNotes = Object.entries(session.collected_data)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

      await sendMeetingInviteEmail({
        to: advisorEmail,
        leadName: lead.name,
        leadPhone: lead.phone || '',
        meetingDate,
        notes: collectedNotes || undefined,
      })
    }

    logger.info('Lead qualified by SDR', { leadId, meetingDate: meetingDate.toISOString() })
  }

  private async triggerKestraFlow(
    sessionId: string,
    message: string,
    leadId: string,
    leadName: string,
    leadPhone: string,
    leadContext: string,
    currentStage: string,
    tenantId: string
  ): Promise<SdrAgentResponse | null> {
    try {
      const baseUrl = this.getBaseUrl()
      const executeUrl = `${baseUrl}/api/v1/executions/${KESTRA_NAMESPACE}/${KESTRA_FLOW_ID}`

      const formData = new FormData()
      formData.append('lead_message', message)
      formData.append('session_id', sessionId)
      formData.append('lead_id', leadId)
      formData.append('lead_name', leadName)
      formData.append('lead_phone', leadPhone)
      formData.append('lead_context', leadContext)
      formData.append('current_stage', currentStage)
      formData.append('tenant_id', tenantId)
      formData.append('api_key', config.kestra.aiApiKey)
      formData.append('supabase_url', config.supabase.url)
      formData.append('supabase_key', config.supabase.serviceKey)
      formData.append('evolution_url', config.evolution.url)
      formData.append('evolution_api_key', config.evolution.apiKey)
      const delaySec = Math.floor(Math.random() * 4) + 2
      formData.append('typing_delay_duration', `PT${delaySec}S`)

      const headers: HeadersInit = {}
      const auth = this.getAuthHeader()
      if (auth) headers['Authorization'] = auth

      const response = await fetch(executeUrl, { method: 'POST', headers, body: formData })

      if (!response.ok) {
        logger.error('Kestra SDR execution failed', { status: response.status })
        return null
      }

      const execution = await response.json() as { id: string }
      return await this.waitForAgentResponse(execution.id)
    } catch (error) {
      logger.error('Error calling SDR agent', { error })
      return null
    }
  }

  private async waitForAgentResponse(executionId: string): Promise<SdrAgentResponse | null> {
    const baseUrl = this.getBaseUrl()
    const pollUrl = `${baseUrl}/api/v1/executions/${executionId}`
    const maxWait = 90000
    const startTime = Date.now()

    while (Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const headers: HeadersInit = {}
      const auth = this.getAuthHeader()
      if (auth) headers['Authorization'] = auth

      const response = await fetch(pollUrl, { headers })
      if (!response.ok) continue

      const execution = await response.json() as {
        state: { current: string }
        taskRunList?: Array<{ taskId: string; outputs?: { textOutput?: string } }>
      }

      if (execution.state.current === 'SUCCESS') {
        const taskRun = execution.taskRunList?.find(t => t.taskId === 'sdr_agent')
        const rawOutput = taskRun?.outputs?.textOutput
        if (!rawOutput) return null
        return this.parseAgentResponse(rawOutput)
      }

      if (execution.state.current === 'FAILED' || execution.state.current === 'KILLED') {
        logger.error('SDR agent execution failed', { executionId })
        return null
      }
    }

    logger.error('SDR agent timed out', { executionId })
    return null
  }

  private parseAgentResponse(raw: string): SdrAgentResponse {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as SdrAgentResponse
      }
    } catch {
      logger.warn('Failed to parse SDR agent JSON response, using raw text')
    }

    return {
      message: raw.replace(/```json[\s\S]*?```/g, '').trim() || raw,
      action: 'none',
      collected_data: {},
      qualification_status: 'pending',
    }
  }
}

export const sdrService = new SdrService()
