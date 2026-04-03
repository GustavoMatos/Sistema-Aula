import { supabase } from '../config/supabase'
import type { CreateStageDTO, UpdateStageDTO, ReorderStagesDTO } from '../validators/kanban.validator'

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

export interface KanbanColumn extends KanbanStage {
  leads: Array<{
    id: string
    name: string
    phone: string
    company: string | null
    potential_value: number | null
    last_contact_at: string | null
    created_at: string
  }>
  lead_count: number
}

class KanbanService {
  // List all stages with lead counts
  async listStages(workspaceId: string): Promise<KanbanStage[]> {
    const { data, error } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })

    if (error) throw new Error(error.message)
    return data as KanbanStage[]
  }

  // Get kanban board with leads
  async getBoard(workspaceId: string): Promise<KanbanColumn[]> {
    // Get stages
    const { data: stages, error: stagesError } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })

    if (stagesError) throw new Error(stagesError.message)

    // Get leads with their stages
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, phone, company, potential_value, last_contact_at, created_at, stage_id')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (leadsError) throw new Error(leadsError.message)

    // Group leads by stage
    const columns: KanbanColumn[] = (stages as KanbanStage[]).map((stage) => {
      const stageLeads = (leads || []).filter((lead) => lead.stage_id === stage.id)
      return {
        ...stage,
        leads: stageLeads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          company: lead.company,
          potential_value: lead.potential_value,
          last_contact_at: lead.last_contact_at,
          created_at: lead.created_at,
        })),
        lead_count: stageLeads.length,
      }
    })

    return columns
  }

  // Create a new stage
  async createStage(workspaceId: string, data: CreateStageDTO): Promise<KanbanStage> {
    // If no position provided, get the max and add 1
    let orderIndex = data.position
    if (orderIndex === undefined) {
      const { data: maxStage } = await supabase
        .from('kanban_stages')
        .select('position')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      orderIndex = (maxStage?.position ?? -1) + 1
    }

    const { data: stage, error } = await supabase
      .from('kanban_stages')
      .insert({
        workspace_id: workspaceId,
        name: data.name,
        color: data.color,
        position: orderIndex,
        is_final: data.is_final ?? false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return stage as KanbanStage
  }

  // Update a stage
  async updateStage(stageId: string, workspaceId: string, data: UpdateStageDTO): Promise<KanbanStage> {
    const { data: stage, error } = await supabase
      .from('kanban_stages')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!stage) throw new Error('Estágio não encontrado')
    return stage as KanbanStage
  }

  // Delete a stage
  async deleteStage(stageId: string, workspaceId: string): Promise<void> {
    // Check if there are leads in this stage
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('stage_id', stageId)
      .eq('workspace_id', workspaceId)

    if (count && count > 0) {
      throw new Error('Não é possível excluir um estágio que contém leads. Mova os leads primeiro.')
    }

    const { error } = await supabase
      .from('kanban_stages')
      .delete()
      .eq('id', stageId)
      .eq('workspace_id', workspaceId)

    if (error) throw new Error(error.message)
  }

  // Reorder stages
  async reorderStages(workspaceId: string, data: ReorderStagesDTO): Promise<KanbanStage[]> {
    // Update all stages with new order indexes
    const updates = data.stages.map((stage) =>
      supabase
        .from('kanban_stages')
        .update({ position: stage.position, updated_at: new Date().toISOString() })
        .eq('id', stage.id)
        .eq('workspace_id', workspaceId)
    )

    await Promise.all(updates)

    // Return updated stages
    return this.listStages(workspaceId)
  }

  // Get stage by ID
  async getStageById(stageId: string, workspaceId: string): Promise<KanbanStage | null> {
    const { data, error } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('id', stageId)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as KanbanStage
  }
}

export const kanbanService = new KanbanService()
