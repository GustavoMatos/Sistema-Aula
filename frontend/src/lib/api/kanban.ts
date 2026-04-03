import { apiClient } from './client'

export interface KanbanStage {
  id: string
  workspace_id: string
  name: string
  color: string
  position: number
  is_final: boolean
  created_at: string
  updated_at: string
}

export interface KanbanLead {
  id: string
  name: string
  phone: string
  company: string | null
  potential_value: number | null
  last_contact_at: string | null
  created_at: string
}

export interface KanbanColumn extends KanbanStage {
  leads: KanbanLead[]
  lead_count: number
}

export interface CreateStageDTO {
  name: string
  color: string
  position?: number
  is_final?: boolean
}

export interface UpdateStageDTO {
  name?: string
  color?: string
  position?: number
  is_final?: boolean
}

export const kanbanApi = {
  // Get kanban board with all columns and leads
  getBoard: async (): Promise<{ columns: KanbanColumn[] }> => {
    return apiClient.get('/api/kanban/board')
  },

  // List all stages
  listStages: async (): Promise<{ stages: KanbanStage[] }> => {
    return apiClient.get('/api/kanban/stages')
  },

  // Get a single stage
  getStage: async (id: string): Promise<KanbanStage> => {
    return apiClient.get(`/api/kanban/stages/${id}`)
  },

  // Create a new stage
  createStage: async (data: CreateStageDTO): Promise<KanbanStage> => {
    return apiClient.post('/api/kanban/stages', data)
  },

  // Update a stage
  updateStage: async (id: string, data: UpdateStageDTO): Promise<KanbanStage> => {
    return apiClient.put(`/api/kanban/stages/${id}`, data)
  },

  // Delete a stage
  deleteStage: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/kanban/stages/${id}`)
  },

  // Reorder stages
  reorderStages: async (
    stages: Array<{ id: string; position: number }>
  ): Promise<{ stages: KanbanStage[] }> => {
    return apiClient.post('/api/kanban/stages/reorder', { stages })
  },
}
