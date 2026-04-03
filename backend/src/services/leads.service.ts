import { supabase } from '../config/supabase.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { leadHistoryService } from './lead-history.service.js'
import type { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from '../validators/leads.validator.js'

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
  created_at: string
  updated_at: string
  kanban_stages?: {
    id: string
    name: string
    color: string
    position: number
  }
}

export interface LeadFilters extends ListLeadsQuery {
  workspaceId: string
}

export interface PaginatedLeads {
  leads: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class LeadsService {
  /**
   * Create a new lead
   */
  async create(workspaceId: string, data: CreateLeadInput, userId?: string): Promise<Lead> {
    // If no stage_id provided, get the first stage (lowest position)
    let stageId = data.stage_id

    if (!stageId) {
      const { data: firstStage, error: stageError } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true })
        .limit(1)
        .single()

      if (stageError || !firstStage) {
        throw new BadRequestError('Nenhum estágio configurado para o workspace')
      }

      stageId = firstStage.id
    } else {
      // Verify stage belongs to workspace
      const { data: stage, error: stageError } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('id', stageId)
        .eq('workspace_id', workspaceId)
        .single()

      if (stageError || !stage) {
        throw new BadRequestError('Estágio inválido')
      }
    }

    // Check if phone number already exists in workspace
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('phone', data.phone)
      .single()

    if (existingLead) {
      throw new BadRequestError('Já existe um lead com este número de telefone')
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        stage_id: stageId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        source: data.source,
        potential_value: data.potential_value,
        tags: data.tags || [],
        notes: data.notes,
      })
      .select('*, kanban_stages(id, name, color, position)')
      .single()

    if (error) {
      logger.error('Failed to create lead', { error })
      throw error
    }

    // Record history
    await leadHistoryService.record({
      lead_id: lead.id,
      action: 'lead_created',
      to_stage_id: stageId,
      metadata: { source: data.source },
      user_id: userId,
    })

    return lead as Lead
  }

  /**
   * List leads with filters and pagination
   */
  async list(filters: LeadFilters): Promise<PaginatedLeads> {
    let query = supabase
      .from('leads')
      .select('*, kanban_stages(id, name, color, position)', { count: 'exact' })
      .eq('workspace_id', filters.workspaceId)

    // Apply filters
    if (filters.stage_id) {
      query = query.eq('stage_id', filters.stage_id)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.tags) {
      const tagsArray = filters.tags.split(',').map((t) => t.trim())
      query = query.overlaps('tags', tagsArray)
    }

    if (filters.source) {
      query = query.eq('source', filters.source)
    }

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date)
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date)
    }

    // Sorting
    const ascending = filters.order === 'asc'
    query = query.order(filters.sort, { ascending })

    // Pagination
    const page = filters.page || 1
    const limit = Math.min(filters.limit || 20, 100) // Max 100 per page
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      logger.error('Failed to list leads', { error })
      throw error
    }

    return {
      leads: data as Lead[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  }

  /**
   * Get a single lead by ID
   */
  async getById(id: string, workspaceId: string): Promise<Lead> {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*, kanban_stages(id, name, color, position)')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !lead) {
      throw new NotFoundError('Lead não encontrado')
    }

    return lead as Lead
  }

  /**
   * Update a lead
   */
  async update(id: string, workspaceId: string, data: UpdateLeadInput, userId?: string): Promise<Lead> {
    // Verify lead exists and belongs to workspace
    await this.getById(id, workspaceId)

    // If updating phone, check for duplicates
    if (data.phone) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('phone', data.phone)
        .neq('id', id)
        .single()

      if (existingLead) {
        throw new BadRequestError('Já existe um lead com este número de telefone')
      }
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, kanban_stages(id, name, color, position)')
      .single()

    if (error) {
      logger.error('Failed to update lead', { error })
      throw error
    }

    // Record history
    const updatedFields = Object.keys(data).filter((key) => data[key as keyof UpdateLeadInput] !== undefined)
    await leadHistoryService.record({
      lead_id: id,
      action: 'lead_updated',
      metadata: { fields: updatedFields },
      user_id: userId,
    })

    return lead as Lead
  }

  /**
   * Delete a lead
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    // Verify lead exists and belongs to workspace
    await this.getById(id, workspaceId)

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error('Failed to delete lead', { error })
      throw error
    }
  }

  /**
   * Update lead stage (for Kanban drag-and-drop)
   */
  async updateStage(id: string, workspaceId: string, stageId: string, userId?: string): Promise<Lead> {
    // Get current lead to capture old stage
    const currentLead = await this.getById(id, workspaceId)
    const oldStageId = currentLead.stage_id

    // Verify stage exists and belongs to workspace
    const { data: stage, error: stageError } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('id', stageId)
      .eq('workspace_id', workspaceId)
      .single()

    if (stageError || !stage) {
      throw new BadRequestError('Estágio inválido')
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        stage_id: stageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, kanban_stages(id, name, color, position)')
      .single()

    if (error) {
      logger.error('Failed to update lead stage', { error })
      throw error
    }

    // Record history
    if (oldStageId !== stageId) {
      await leadHistoryService.record({
        lead_id: id,
        action: 'stage_change',
        from_stage_id: oldStageId,
        to_stage_id: stageId,
        user_id: userId,
      })
    }

    return lead as Lead
  }

  /**
   * Get lead history
   */
  async getHistory(leadId: string, workspaceId: string) {
    // Verify lead exists and belongs to workspace
    await this.getById(leadId, workspaceId)

    return leadHistoryService.getHistory(leadId)
  }
}

export const leadsService = new LeadsService()
