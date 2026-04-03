import { apiClient } from './client'

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

export interface SendMessageDTO {
  lead_id: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  content?: string | null
  media_url?: string | null
  caption?: string | null
}

export interface MessagesResponse {
  messages: Message[]
  total: number
}

export const messagesApi = {
  // Send a message
  send: async (data: SendMessageDTO): Promise<Message> => {
    return apiClient.post('/api/messages/send', data)
  },

  // Get messages for a lead
  getByLead: async (
    leadId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<MessagesResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    return apiClient.get(`/api/messages/lead/${leadId}${query ? `?${query}` : ''}`)
  },

  // Get single message
  getById: async (id: string): Promise<Message> => {
    return apiClient.get(`/api/messages/${id}`)
  },
}
