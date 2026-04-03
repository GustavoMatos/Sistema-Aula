import { apiClient } from './client'

export interface Followup {
  id: string
  workspace_id: string
  lead_id: string
  user_id: string
  title: string
  description: string | null
  due_date: string
  priority: 'low' | 'medium' | 'high'
  type: 'call' | 'message' | 'meeting' | 'email' | 'other'
  status: 'pending' | 'completed' | 'cancelled'
  completed_at: string | null
  created_at: string
  updated_at: string
  lead?: {
    id: string
    name: string
    phone: string
  }
}

export interface FollowupFilters {
  lead_id?: string
  status?: 'pending' | 'completed' | 'cancelled' | 'all'
  priority?: 'low' | 'medium' | 'high'
  type?: 'call' | 'message' | 'meeting' | 'email' | 'other'
  from_date?: string
  to_date?: string
  overdue?: 'true' | 'false'
  page?: number
  limit?: number
}

export interface PaginatedFollowups {
  followups: Followup[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateFollowupDTO {
  lead_id: string
  title: string
  description?: string
  due_date: string
  priority?: 'low' | 'medium' | 'high'
  type?: 'call' | 'message' | 'meeting' | 'email' | 'other'
}

export interface UpdateFollowupDTO {
  title?: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  type?: 'call' | 'message' | 'meeting' | 'email' | 'other'
  status?: 'pending' | 'completed' | 'cancelled'
}

export interface FollowupCounts {
  pending: number
  completed: number
  overdue: number
}

export const followupsApi = {
  // List followups with filters
  list: async (filters: FollowupFilters = {}): Promise<PaginatedFollowups> => {
    const params = new URLSearchParams()

    if (filters.lead_id) params.set('lead_id', filters.lead_id)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.type) params.set('type', filters.type)
    if (filters.from_date) params.set('from_date', filters.from_date)
    if (filters.to_date) params.set('to_date', filters.to_date)
    if (filters.overdue) params.set('overdue', filters.overdue)
    if (filters.page) params.set('page', filters.page.toString())
    if (filters.limit) params.set('limit', filters.limit.toString())

    const query = params.toString()
    return apiClient.get(`/api/followups${query ? `?${query}` : ''}`)
  },

  // Get single followup
  getById: async (id: string): Promise<Followup> => {
    return apiClient.get(`/api/followups/${id}`)
  },

  // Create followup
  create: async (data: CreateFollowupDTO): Promise<Followup> => {
    return apiClient.post('/api/followups', data)
  },

  // Update followup
  update: async (id: string, data: UpdateFollowupDTO): Promise<Followup> => {
    return apiClient.put(`/api/followups/${id}`, data)
  },

  // Delete followup
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/followups/${id}`)
  },

  // Complete followup
  complete: async (id: string): Promise<Followup> => {
    return apiClient.post(`/api/followups/${id}/complete`)
  },

  // Get today's followups
  getToday: async (): Promise<{ followups: Followup[] }> => {
    return apiClient.get('/api/followups/today')
  },

  // Get overdue followups
  getOverdue: async (): Promise<{ followups: Followup[] }> => {
    return apiClient.get('/api/followups/overdue')
  },

  // Get counts
  getCounts: async (): Promise<FollowupCounts> => {
    return apiClient.get('/api/followups/counts')
  },
}
