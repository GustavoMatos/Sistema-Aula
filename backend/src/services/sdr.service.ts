import { supabase } from '../config/supabase.js'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'
import { leadHistoryService } from './lead-history.service.js'
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
      logger.info('SDR session already exists', { leadId, status: existing.status })
      return
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

    await this.moveLeadToStage(leadId, tenantId, STAGE_NAMES.PRIMEIRO_CONTATO)

    const { data: lead } = await supabase
      .from('leads')
      .select('name')
      .eq('id', leadId)
      .single()

    const greeting = await this.callAgent(
      sessionId,
      'Ola, gostaria de saber mais sobre investimentos',
      lead?.name || 'Cliente',
      '{}',
      STAGE_NAMES.PRIMEIRO_CONTATO
    )

    if (greeting) {
      await this.sendWhatsAppMessage(leadId, tenantId, greeting.message)
    }
  }

  async processIncomingMessage(leadId: string, tenantId: string, messageContent: string): Promise<void> {
    const { data: session } = await supabase
      .from('sdr_sessions')
      .select('*')
      .eq('lead_id', leadId)
      .single()

    if (!session || session.status !== 'active') return

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
      .select('name, stage_id, kanban_stages(name)')
      .eq('id', leadId)
      .single()

    const currentStage = (lead as any)?.kanban_stages?.name || STAGE_NAMES.PRIMEIRO_CONTATO

    const response = await this.callAgent(
      sdrSession.kestra_session_id || `sdr-${leadId}`,
      messageContent,
      lead?.name || 'Cliente',
      JSON.stringify(sdrSession.collected_data),
      currentStage
    )

    if (!response) return

    if (response.collected_data && Object.keys(response.collected_data).length > 0) {
      const merged = { ...sdrSession.collected_data, ...response.collected_data }
      await supabase
        .from('sdr_sessions')
        .update({ collected_data: merged, updated_at: new Date().toISOString() })
        .eq('id', sdrSession.id)
    }

    switch (response.action) {
      case 'move_to_qualification':
        await this.moveLeadToStage(leadId, tenantId, STAGE_NAMES.QUALIFICACAO)
        break

      case 'qualify':
        await this.qualifyLead(leadId, tenantId, sdrSession, response)
        break

      case 'disqualify':
        await this.disqualifyLead(leadId, tenantId, sdrSession)
        break
    }

    await this.sendWhatsAppMessage(leadId, tenantId, response.message)
  }

  private async qualifyLead(
    leadId: string,
    tenantId: string,
    session: SdrSession,
    response: SdrAgentResponse
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

    await this.moveLeadToStage(leadId, tenantId, STAGE_NAMES.REUNIAO_AGENDADA)

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

    await leadHistoryService.record({
      lead_id: leadId,
      action: 'stage_change',
      metadata: {
        reason: 'sdr_qualified',
        meeting_date: meetingDate.toISOString(),
        collected_data: response.collected_data,
      },
    })

    logger.info('Lead qualified by SDR', { leadId, meetingDate: meetingDate.toISOString() })
  }

  private async disqualifyLead(leadId: string, tenantId: string, session: SdrSession): Promise<void> {
    await supabase
      .from('sdr_sessions')
      .update({ status: 'disqualified', updated_at: new Date().toISOString() })
      .eq('id', session.id)

    await this.moveLeadToStage(leadId, tenantId, STAGE_NAMES.DESCARTADO)

    await leadHistoryService.record({
      lead_id: leadId,
      action: 'stage_change',
      metadata: { reason: 'sdr_disqualified', collected_data: session.collected_data },
    })

    logger.info('Lead disqualified by SDR', { leadId })
  }

  private async moveLeadToStage(leadId: string, tenantId: string, stageName: string): Promise<void> {
    const { data: lead } = await supabase
      .from('leads')
      .select('stage_id')
      .eq('id', leadId)
      .single()

    const { data: stage } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', stageName)
      .single()

    if (!stage) {
      logger.error('Stage not found', { stageName, tenantId })
      return
    }

    await supabase
      .from('leads')
      .update({ stage_id: stage.id, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    if (lead?.stage_id !== stage.id) {
      await leadHistoryService.record({
        lead_id: leadId,
        action: 'stage_change',
        metadata: { from_stage_id: lead?.stage_id, to_stage_id: stage.id, source: 'sdr_agent' },
      })
    }
  }

  private async sendWhatsAppMessage(leadId: string, tenantId: string, content: string): Promise<void> {
    const { data: lead } = await supabase
      .from('leads')
      .select('phone')
      .eq('id', leadId)
      .single()

    if (!lead?.phone) return

    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, api_key')
      .eq('tenant_id', tenantId)
      .eq('status', 'connected')
      .limit(1)
      .single()

    if (!instance) {
      logger.warn('No connected WhatsApp instance for tenant', { tenantId })
      return
    }

    try {
      const evolutionUrl = config.evolution.url.replace(/\/$/, '')
      const response = await fetch(`${evolutionUrl}/message/sendText/${instance.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': instance.api_key || config.evolution.apiKey,
        },
        body: JSON.stringify({
          number: lead.phone,
          text: content,
        }),
      })

      const result = await response.json() as { key?: { id?: string } }

      await supabase.from('messages').insert({
        lead_id: leadId,
        direction: 'outbound',
        content_type: 'text',
        content,
        status: 'sent',
        whatsapp_message_id: result?.key?.id || null,
        sent_at: new Date().toISOString(),
      })

      await supabase
        .from('leads')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', leadId)

      await leadHistoryService.record({
        lead_id: leadId,
        action: 'message_sent',
        metadata: { content_type: 'text', is_automated: true, source: 'sdr_agent' },
      })
    } catch (error) {
      logger.error('SDR failed to send WhatsApp message', { error, leadId })
    }
  }

  private async callAgent(
    sessionId: string,
    message: string,
    leadName: string,
    leadContext: string,
    currentStage: string
  ): Promise<SdrAgentResponse | null> {
    try {
      const baseUrl = this.getBaseUrl()
      const executeUrl = `${baseUrl}/api/v1/executions/${KESTRA_NAMESPACE}/${KESTRA_FLOW_ID}`

      const formData = new FormData()
      formData.append('lead_message', message)
      formData.append('session_id', sessionId)
      formData.append('lead_name', leadName)
      formData.append('lead_context', leadContext)
      formData.append('current_stage', currentStage)
      formData.append('api_key', config.kestra.aiApiKey)

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
