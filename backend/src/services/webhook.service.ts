import { supabase } from '../config/supabase.js'
import { leadHistoryService } from './lead-history.service.js'
import { sdrService } from './sdr.service.js'

// Evolution API v2 webhook event types
export interface EvolutionWebhookEvent {
  event: string
  instance: string
  data: Record<string, unknown>
  date_time: string
  sender: string
  server_url: string
  apikey: string
}

export interface MessageData {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  pushName?: string
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
    imageMessage?: {
      url?: string
      caption?: string
      mimetype?: string
    }
    documentMessage?: {
      url?: string
      fileName?: string
      mimetype?: string
    }
    audioMessage?: {
      url?: string
      mimetype?: string
    }
    videoMessage?: {
      url?: string
      caption?: string
      mimetype?: string
    }
  }
  messageType?: string
  messageTimestamp?: number
  status?: string
}

class WebhookService {
  private pendingMessages: Map<string, { leadId: string; tenantId: string; messages: string[]; timer: ReturnType<typeof setTimeout> }> = new Map()
  private readonly DEBOUNCE_MS = 5000

  private debounceSdrCall(leadId: string, tenantId: string, content: string, isNew: boolean): void {
    const key = leadId

    if (isNew) {
      sdrService.startSession(leadId, tenantId).catch(err =>
        console.error('[SDR] Failed to start session:', err)
      )
      return
    }

    const existing = this.pendingMessages.get(key)
    if (existing) {
      clearTimeout(existing.timer)
      existing.messages.push(content)
      existing.timer = setTimeout(() => {
        const batch = this.pendingMessages.get(key)
        if (batch) {
          this.pendingMessages.delete(key)
          const combined = batch.messages.join('\n')
          sdrService.processIncomingMessage(batch.leadId, batch.tenantId, combined).catch(err =>
            console.error('[SDR] Failed to process message:', err)
          )
        }
      }, this.DEBOUNCE_MS)
    } else {
      const timer = setTimeout(() => {
        const batch = this.pendingMessages.get(key)
        if (batch) {
          this.pendingMessages.delete(key)
          const combined = batch.messages.join('\n')
          sdrService.processIncomingMessage(batch.leadId, batch.tenantId, combined).catch(err =>
            console.error('[SDR] Failed to process message:', err)
          )
        }
      }, this.DEBOUNCE_MS)
      this.pendingMessages.set(key, { leadId, tenantId, messages: [content], timer })
    }
  }

  // Process incoming message
  async processIncomingMessage(instanceName: string, data: MessageData): Promise<void> {
    try {
      const { key, message, pushName } = data

      // Ignore outgoing messages
      if (key.fromMe) return

      // Extract phone number from remoteJid (format: 5511999998888@s.whatsapp.net)
      const rawPhone = key.remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
      const phone = this.normalizeBrazilianPhone(rawPhone)

      // Get message content
      const content = this.extractMessageContent(message)
      const contentType = this.getContentType(message)

      // Find or create lead
      const { lead, isNew } = await this.findOrCreateLead(instanceName, phone, pushName || 'Sem nome')

      if (!lead) {
        console.error('Could not find or create lead for phone:', phone)
        return
      }

      // Save message
      await this.saveMessage(lead.id, instanceName, {
        direction: 'inbound',
        content,
        contentType,
        whatsappMessageId: key.id,
      })

      // Update lead last_contact_at
      await this.updateLeadLastContact(lead.id)

      // Record in history
      await leadHistoryService.record({
        lead_id: lead.id,
        action: 'message_received',
        metadata: {
          preview: content?.substring(0, 100) || 'Midia recebida',
          content_type: contentType,
        },
      })

      // SDR Agent: debounce messages to batch rapid sequential messages
      if (content) {
        this.debounceSdrCall(lead.id, lead.tenant_id, content, isNew)
      } else if (isNew) {
        sdrService.startSession(lead.id, lead.tenant_id).catch(err =>
          console.error('[SDR] Failed to start session:', err)
        )
      }
    } catch (error) {
      console.error('Error processing incoming message:', error)
      throw error
    }
  }

  // Process message status update
  async processMessageStatus(_instanceName: string, data: Record<string, unknown>): Promise<void> {
    try {
      const messageId = data.id as string
      const status = data.status as string

      if (!messageId || !status) return

      // Map Evolution API status to our status
      const statusMap: Record<string, string> = {
        'DELIVERY_ACK': 'delivered',
        'READ': 'read',
        'SENT': 'sent',
        'PENDING': 'pending',
        'ERROR': 'failed',
      }

      const mappedStatus = statusMap[status] || status.toLowerCase()

      // Update message status
      await supabase
        .from('messages')
        .update({ status: mappedStatus })
        .eq('whatsapp_message_id', messageId)
    } catch (error) {
      console.error('Error processing message status:', error)
    }
  }

  // Process connection status update
  async processConnectionStatus(instanceName: string, status: string): Promise<void> {
    try {
      const statusMap: Record<string, string> = {
        'open': 'connected',
        'close': 'disconnected',
        'connecting': 'connecting',
      }

      const mappedStatus = statusMap[status] || status

      await supabase
        .from('whatsapp_instances')
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('instance_name', instanceName)
    } catch (error) {
      console.error('Error processing connection status:', error)
    }
  }

  private normalizeBrazilianPhone(phone: string): string {
    if (phone.startsWith('55') && phone.length === 12) {
      const ddd = phone.substring(2, 4)
      const number = phone.substring(4)
      if (number.length === 8 && /^[6-9]/.test(number)) {
        return `55${ddd}9${number}`
      }
    }
    return phone
  }

  private extractMessageContent(message?: MessageData['message']): string | null {
    if (!message) return null

    if (message.conversation) return message.conversation
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
    if (message.imageMessage?.caption) return message.imageMessage.caption
    if (message.videoMessage?.caption) return message.videoMessage.caption

    return null
  }

  private getContentType(message?: MessageData['message']): string {
    if (!message) return 'text'

    if (message.imageMessage) return 'image'
    if (message.documentMessage) return 'document'
    if (message.audioMessage) return 'audio'
    if (message.videoMessage) return 'video'

    return 'text'
  }

  private async findOrCreateLead(
    instanceName: string,
    phone: string,
    name: string
  ): Promise<{ lead: { id: string; tenant_id: string } | null; isNew: boolean }> {
    // Get workspace from instance
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id')
      .eq('instance_name', instanceName)
      .single()

    if (instanceError || !instance) {
      console.error('Instance not found:', instanceName)
      return { lead: null, isNew: false }
    }

    const workspaceId = instance.tenant_id

    // Try to find existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, tenant_id')
      .eq('tenant_id', workspaceId)
      .eq('phone', phone)
      .single()

    if (existingLead) {
      return { lead: existingLead, isNew: false }
    }

    // Get default stage
    const { data: defaultStage } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('tenant_id', workspaceId)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    if (!defaultStage) {
      console.error('No default stage found for workspace:', workspaceId)
      return { lead: null, isNew: false }
    }

    // Create new lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        tenant_id: workspaceId,
        stage_id: defaultStage.id,
        name,
        phone,
        source: 'whatsapp',
        last_contact_at: new Date().toISOString(),
      })
      .select('id, tenant_id')
      .single()

    if (createError || !newLead) {
      console.error('Error creating lead:', createError)
      return { lead: null, isNew: false }
    }

    // Record lead creation in history
    await leadHistoryService.record({
      lead_id: newLead.id,
      action: 'lead_created',
      metadata: { source: 'whatsapp_webhook' },
    })

    return { lead: newLead, isNew: true }
  }

  private async saveMessage(
    leadId: string,
    instanceName: string,
    messageData: {
      direction: 'inbound' | 'outbound'
      content: string | null
      contentType: string
      whatsappMessageId: string
    }
  ): Promise<void> {
    // Get instance ID
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .single()

    await supabase.from('messages').insert({
      lead_id: leadId,
      instance_id: instance?.id || null,
      direction: messageData.direction,
      content_type: messageData.contentType,
      content: messageData.content,
      whatsapp_message_id: messageData.whatsappMessageId,
      status: messageData.direction === 'inbound' ? 'delivered' : 'pending',
      sent_at: new Date().toISOString(),
    })
  }

  private async updateLeadLastContact(leadId: string): Promise<void> {
    await supabase
      .from('leads')
      .update({
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
  }
}

export const webhookService = new WebhookService()
