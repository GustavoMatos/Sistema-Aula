import { apiClient } from './client'

export interface WhatsAppInstance {
  id: string
  workspace_id: string
  instance_name: string
  api_key: string | null
  api_url: string | null
  status: 'connected' | 'disconnected' | 'connecting'
  phone_number: string | null
  qr_code: string | null
  created_at: string
  updated_at: string
}

export interface QRCodeResponse {
  pairingCode?: string
  qrCode?: string
  count?: number
}

export interface InstanceStatusResponse {
  status: 'connected' | 'disconnected' | 'connecting'
  phoneNumber?: string
}

export const whatsappApi = {
  // List all instances
  listInstances: async (): Promise<{ instances: WhatsAppInstance[] }> => {
    return apiClient.get('/api/whatsapp/instances')
  },

  // Get single instance
  getInstance: async (id: string): Promise<WhatsAppInstance> => {
    return apiClient.get(`/api/whatsapp/instances/${id}`)
  },

  // Create instance
  createInstance: async (name: string): Promise<WhatsAppInstance> => {
    return apiClient.post('/api/whatsapp/instances', { name })
  },

  // Get QR Code
  getQRCode: async (id: string): Promise<QRCodeResponse> => {
    return apiClient.get(`/api/whatsapp/instances/${id}/qr`)
  },

  // Get status
  getStatus: async (id: string): Promise<InstanceStatusResponse> => {
    return apiClient.get(`/api/whatsapp/instances/${id}/status`)
  },

  // Logout instance
  logoutInstance: async (id: string): Promise<void> => {
    return apiClient.post(`/api/whatsapp/instances/${id}/logout`)
  },

  // Delete instance
  deleteInstance: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/whatsapp/instances/${id}`)
  },
}
