import { supabase } from '../config/supabase.js'
import { leadHistoryService } from './lead-history.service.js'

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
  // Process incoming message
  async processIncomingMessage(instanceName: string, data: MessageData): Promise<void> {
    try {
      const { key, message, pushName } = data

      // Ignore outgoing messages
      if (key.fromMe) return

      // Extract phone number from remoteJid (format: 5511999998888@s.whatsapp.net)
      const phone = key.remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')

      // Get message content
      const content = this.extractMessageContent(message)
      const contentType = this.getContentType(message)

      // Find or create lead
      const lead = await this.findOrCreateLead(instanceName, phone, pushName || 'Sem nome')

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
  ): Promise<{ id: string; workspace_id: string } | null> {
    // Get workspace from instance
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('workspace_id')
      .eq('instance_name', instanceName)
      .single()

    if (instanceError || !instance) {
      console.error('Instance not found:', instanceName)
      return null
    }

    const workspaceId = instance.workspace_id

    // Try to find existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('phone', phone)
      .single()

    if (existingLead) {
      return existingLead
    }

    // Get default stage
    const { data: defaultStage } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    if (!defaultStage) {
      console.error('No default stage found for workspace:', workspaceId)
      return null
    }

    // Create new lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        stage_id: defaultStage.id,
        name,
        phone,
        source: 'whatsapp',
        last_contact_at: new Date().toISOString(),
      })
      .select('id, workspace_id')
      .single()

    if (createError || !newLead) {
      console.error('Error creating lead:', createError)
      return null
    }

    // Record lead creation in history
    await leadHistoryService.record({
      lead_id: newLead.id,
      action: 'lead_created',
      metadata: { source: 'whatsapp_webhook' },
    })

    return newLead
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
