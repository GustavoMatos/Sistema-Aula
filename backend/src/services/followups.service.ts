import { supabase } from '../config/supabase.js'
import type { CreateFollowupDTO, UpdateFollowupDTO, ListFollowupsQuery } from '../validators/followups.validator.js'

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

export interface PaginatedFollowups {
  followups: Followup[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class FollowupsService {
  // List followups with filters
  async list(workspaceId: string, query: ListFollowupsQuery): Promise<PaginatedFollowups> {
    const { page, limit, lead_id, status, priority, type, from_date, to_date, overdue } = query

    let countQuery = supabase
      .from('followups')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    let dataQuery = supabase
      .from('followups')
      .select(`
        *,
        lead:leads(id, name, phone)
      `)
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (lead_id) {
      countQuery = countQuery.eq('lead_id', lead_id)
      dataQuery = dataQuery.eq('lead_id', lead_id)
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }

    if (priority) {
      countQuery = countQuery.eq('priority', priority)
      dataQuery = dataQuery.eq('priority', priority)
    }

    if (type) {
      countQuery = countQuery.eq('type', type)
      dataQuery = dataQuery.eq('type', type)
    }

    if (from_date) {
      countQuery = countQuery.gte('due_date', from_date)
      dataQuery = dataQuery.gte('due_date', from_date)
    }

    if (to_date) {
      countQuery = countQuery.lte('due_date', to_date)
      dataQuery = dataQuery.lte('due_date', to_date)
    }

    if (overdue === 'true') {
      const now = new Date().toISOString()
      countQuery = countQuery.lt('due_date', now).eq('status', 'pending')
      dataQuery = dataQuery.lt('due_date', now).eq('status', 'pending')
    }

    // Get total count
    const { count, error: countError } = await countQuery

    if (countError) throw new Error(countError.message)

    // Get paginated data
    const offset = (page - 1) * limit

    const { data, error } = await dataQuery
      .order('due_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    return {
      followups: data as Followup[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  }

  // Get followup by ID
  async getById(id: string, workspaceId: string): Promise<Followup | null> {
    const { data, error } = await supabase
      .from('followups')
      .select(`
        *,
        lead:leads(id, name, phone)
      `)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data as Followup
  }

  // Create followup
  async create(workspaceId: string, userId: string, data: CreateFollowupDTO): Promise<Followup> {
    // Verify lead belongs to workspace
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', data.lead_id)
      .eq('workspace_id', workspaceId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead não encontrado')
    }

    const { data: followup, error } = await supabase
      .from('followups')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        lead_id: data.lead_id,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date,
        priority: data.priority,
        type: data.type,
        status: 'pending',
      })
      .select(`
        *,
        lead:leads(id, name, phone)
      `)
      .single()

    if (error) throw new Error(error.message)

    return followup as Followup
  }

  // Update followup
  async update(id: string, workspaceId: string, data: UpdateFollowupDTO): Promise<Followup> {
    const updateData: Record<string, unknown> = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    // If marking as completed, set completed_at
    if (data.status === 'completed' && !data.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }

    // If marking as pending or cancelled, clear completed_at
    if (data.status === 'pending' || data.status === 'cancelled') {
      updateData.completed_at = null
    }

    const { data: followup, error } = await supabase
      .from('followups')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select(`
        *,
        lead:leads(id, name, phone)
      `)
      .single()

    if (error) throw new Error(error.message)
    if (!followup) throw new Error('Follow-up não encontrado')

    return followup as Followup
  }

  // Delete followup
  async delete(id: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('followups')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw new Error(error.message)
  }

  // Mark as completed
  async complete(id: string, workspaceId: string): Promise<Followup> {
    return this.update(id, workspaceId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }

  // Get today's followups
  async getTodayFollowups(workspaceId: string): Promise<Followup[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('followups')
      .select(`
        *,
        lead:leads(id, name, phone)
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString())
      .order('due_date', { ascending: true })

    if (error) throw new Error(error.message)

    return data as Followup[]
  }

  // Get overdue followups
  async getOverdueFollowups(workspaceId: string): Promise<Followup[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('followups')
      .select(`
        *,
        lead:leads(id, name, phone)
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .lt('due_date', now)
      .order('due_date', { ascending: true })
      .limit(50)

    if (error) throw new Error(error.message)

    return data as Followup[]
  }

  // Get followups count by status
  async getCountsByStatus(workspaceId: string): Promise<{ pending: number; completed: number; overdue: number }> {
    const now = new Date().toISOString()

    const [pendingResult, completedResult, overdueResult] = await Promise.all([
      supabase
        .from('followups')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending'),
      supabase
        .from('followups')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'completed'),
      supabase
        .from('followups')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .lt('due_date', now),
    ])

    return {
      pending: pendingResult.count || 0,
      completed: completedResult.count || 0,
      overdue: overdueResult.count || 0,
    }
  }
}

export const followupsService = new FollowupsService()
