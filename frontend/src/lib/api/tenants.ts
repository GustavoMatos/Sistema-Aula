import { apiClient } from './client'

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  max_users: number
  is_active: boolean
  user_count?: number
  created_at: string
  updated_at: string
}

export interface TenantDetail extends Tenant {
  users: {
    id: string
    email: string
    full_name: string | null
    role: string
    is_active: boolean
    created_at: string
  }[]
}

export interface CreateTenantWithAdminDTO {
  tenant_name: string
  tenant_plan?: 'free' | 'basic' | 'pro'
  tenant_max_users?: number
  admin_email: string
  admin_password: string
  admin_full_name?: string
}

export const tenantsApi = {
  list: async (): Promise<{ tenants: Tenant[] }> => {
    return apiClient.get('/api/tenants')
  },

  getById: async (id: string): Promise<{ tenant: TenantDetail }> => {
    return apiClient.get(`/api/tenants/${id}`)
  },

  createWithAdmin: async (data: CreateTenantWithAdminDTO): Promise<{ message: string; tenant: Tenant & { admin: { id: string; email: string; full_name: string; role: string } } }> => {
    return apiClient.post('/api/tenants/with-admin', data)
  },

  update: async (id: string, data: { name?: string; plan?: string; max_users?: number; is_active?: boolean }): Promise<{ tenant: Tenant }> => {
    return apiClient.put(`/api/tenants/${id}`, data)
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/tenants/${id}`)
  },
}
