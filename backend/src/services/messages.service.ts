import { supabase } from '../config/supabase.js'
import { evolutionService } from './evolution/index.js'
import { leadHistoryService } from './lead-history.service.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import type { SendMessageInput } from '../validators/messages.validator.js'

export interface Message {
  id: string
  lead_id: string
  instance_id: string
  direction: 'inbound' | 'outbound'
  content_type: string
  content: string | null
  media_url: string | null
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  whatsapp_message_id: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  created_at: string
}

export interface SendMessageDTO extends SendMessageInput {
  workspace_id: string
  user_id?: string
}

class MessagesService {
  /**
   * Send a message to a lead via WhatsApp
   */
  async send(data: SendMessageDTO): Promise<Message> {
    // Get lead with workspace validation
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', data.lead_id)
      .eq('workspace_id', data.workspace_id)
      .single()

    if (leadError || !lead) {
      throw new NotFoundError('Lead não encontrado')
    }

    if (!lead.phone) {
      throw new BadRequestError('Lead não possui número de telefone')
    }

    // Get the WhatsApp instance for the workspace
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('workspace_id', data.workspace_id)
      .eq('status', 'connected')
      .limit(1)
      .single()

    if (instanceError || !instance) {
      throw new BadRequestError('Nenhuma instância WhatsApp conectada')
    }

    // Send message via Evolution API
    let whatsappMessageId: string | null = null

    try {
      if (data.type === 'text') {
        const response = await evolutionService.sendText(
          instance.instance_name,
          lead.phone,
          data.content!,
          {},
          instance.api_key || undefined
        )
        whatsappMessageId = response.key?.id || null
      } else {
        // Media message (image, document, audio, video)
        const mediaTypeMap: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
          image: 'image',
          document: 'document',
          audio: 'audio',
          video: 'video',
        }

        const response = await evolutionService.sendMedia(
          instance.instance_name,
          lead.phone,
          {
            url: data.media_url!,
            type: mediaTypeMap[data.type],
            caption: data.caption || undefined,
          },
          instance.api_key || undefined
        )
        whatsappMessageId = response.key?.id || null
      }
    } catch (error) {
      logger.error('Failed to send message via Evolution API', { error, data })
      throw new BadRequestError('Falha ao enviar mensagem via WhatsApp')
    }

    // Save message to database
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        lead_id: data.lead_id,
        instance_id: instance.id,
        direction: 'outbound',
        content_type: data.type,
        content: data.content || data.caption || null,
        media_url: data.media_url || null,
        status: 'sent',
        whatsapp_message_id: whatsappMessageId,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (messageError) {
      logger.error('Failed to save message to database', { error: messageError })
      // Message was sent but not saved - still return success but log error
    }

    // Update lead's last_contact_at
    await supabase
      .from('leads')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('id', data.lead_id)

    // Record in lead history
    await leadHistoryService.record({
      lead_id: data.lead_id,
      action: 'message_sent',
      metadata: {
        message_id: message?.id,
        content_type: data.type,
        is_automated: false,
      },
      user_id: data.user_id,
    })

    return message as Message
  }

  /**
   * Get messages for a lead
   */
  async getByLead(
    leadId: string,
    workspaceId: string,
    limit = 50,
    offset = 0
  ): Promise<{ messages: Message[]; total: number }> {
    // Verify lead belongs to workspace
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)
      .single()

    if (leadError || !lead) {
      throw new NotFoundError('Lead não encontrado')
    }

    // Get messages
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Failed to fetch messages', { error })
      throw error
    }

    return {
      messages: messages as Message[],
      total: count || 0,
    }
  }

  /**
   * Get a single message by ID
   */
  async getById(id: string, workspaceId: string): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*, leads!inner(workspace_id)')
      .eq('id', id)
      .single()

    if (error || !message) {
      throw new NotFoundError('Mensagem não encontrada')
    }

    // Verify workspace access through lead
    if (message.leads?.workspace_id !== workspaceId) {
      throw new NotFoundError('Mensagem não encontrada')
    }

    return message as Message
  }
}

export const messagesService = new MessagesService()
