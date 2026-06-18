import { apiClient } from './client'

export type UserRole = 'superadmin' | 'admin_tenant' | 'user_tenant'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  tenant?: {
    id: string
    name: string
    slug: string
    plan: string
  } | null
}

export interface UserListItem {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface InvitationItem {
  id: string
  email: string
  role: UserRole
  expires_at: string
  accepted_at: string | null
  created_at: string
  status: 'pending' | 'accepted' | 'expired'
  inviter: { email: string; full_name: string | null } | null
}

export const usersApi = {
  getMe: async (): Promise<{ user: UserProfile }> => {
    return apiClient.get('/api/users/me')
  },

  list: async (): Promise<{ users: UserListItem[] }> => {
    return apiClient.get('/api/users')
  },

  update: async (id: string, data: { full_name?: string; role?: UserRole; is_active?: boolean }): Promise<{ user: UserListItem }> => {
    return apiClient.put(`/api/users/${id}`, data)
  },

  deactivate: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/users/${id}`)
  },

  invite: async (data: { email: string; role?: 'admin_tenant' | 'user_tenant'; tenant_id?: string }): Promise<{
    message: string
    invitation: { id: string; email: string; role: string; expires_at: string; invite_url: string }
  }> => {
    return apiClient.post('/api/invitations', data)
  },

  listInvitations: async (): Promise<{ invitations: InvitationItem[] }> => {
    return apiClient.get('/api/invitations')
  },

  cancelInvitation: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/invitations/${id}`)
  },

  resendInvitation: async (id: string): Promise<{ message: string }> => {
    return apiClient.post(`/api/invitations/${id}/resend`, {})
  },
}
