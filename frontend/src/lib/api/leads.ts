import { apiClient } from './client'

export interface Lead {
  id: string
  workspace_id: string
  stage_id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  source: string | null
  potential_value: number | null
  tags: string[]
  notes: string | null
  last_contact_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  kanban_stages?: {
    id: string
    name: string
    color: string
    position: number
  }
}

export interface LeadFilters {
  stage_id?: string
  tags?: string
  source?: string
  search?: string
  from_date?: string
  to_date?: string
  sort?: 'created_at' | 'updated_at' | 'last_contact_at' | 'name' | 'potential_value'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginatedLeads {
  leads: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateLeadDTO {
  name: string
  phone: string
  email?: string | null
  company?: string | null
  source?: string | null
  potential_value?: number | null
  tags?: string[]
  notes?: string | null
  stage_id?: string
}

export interface UpdateLeadDTO {
  name?: string
  phone?: string
  email?: string | null
  company?: string | null
  source?: string | null
  potential_value?: number | null
  tags?: string[]
  notes?: string | null
}

export interface ImportResult {
  imported: number
  duplicates: number
  errors: Array<{ row: number; field: string; error: string }>
  total_rows: number
}

export const leadsApi = {
  // List leads with filters
  list: async (filters: LeadFilters = {}): Promise<PaginatedLeads> => {
    const params = new URLSearchParams()

    if (filters.stage_id) params.set('stage_id', filters.stage_id)
    if (filters.tags) params.set('tags', filters.tags)
    if (filters.source) params.set('source', filters.source)
    if (filters.search) params.set('search', filters.search)
    if (filters.from_date) params.set('from_date', filters.from_date)
    if (filters.to_date) params.set('to_date', filters.to_date)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.order) params.set('order', filters.order)
    if (filters.page) params.set('page', filters.page.toString())
    if (filters.limit) params.set('limit', filters.limit.toString())

    const query = params.toString()
    return apiClient.get(`/api/leads${query ? `?${query}` : ''}`)
  },

  // Get single lead
  getById: async (id: string): Promise<Lead> => {
    return apiClient.get(`/api/leads/${id}`)
  },

  // Create lead
  create: async (data: CreateLeadDTO): Promise<Lead> => {
    return apiClient.post('/api/leads', data)
  },

  // Update lead
  update: async (id: string, data: UpdateLeadDTO): Promise<Lead> => {
    return apiClient.put(`/api/leads/${id}`, data)
  },

  // Delete lead
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/leads/${id}`)
  },

  // Move lead to stage
  moveStage: async (id: string, stageId: string): Promise<Lead> => {
    return apiClient.patch(`/api/leads/${id}/stage`, { stage_id: stageId })
  },

  // Get lead history
  getHistory: async (id: string): Promise<{ history: unknown[] }> => {
    return apiClient.get(`/api/leads/${id}/history`)
  },

  // Import leads from CSV
  import: async (file: File): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.upload('/api/leads/import', formData)
  },
}
