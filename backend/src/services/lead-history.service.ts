import { supabase } from '../config/supabase.js'
import { logger } from '../utils/logger.js'

export type LeadAction =
  | 'lead_created'
  | 'stage_change'
  | 'lead_updated'
  | 'note_added'
  | 'tag_added'
  | 'tag_removed'
  | 'message_sent'
  | 'message_received'
  | 'automation_paused'
  | 'automation_resumed'

export interface RecordHistoryDTO {
  lead_id: string
  action: LeadAction
  from_stage_id?: string | null
  to_stage_id?: string | null
  metadata?: Record<string, unknown>
  user_id?: string | null
}

export interface LeadHistoryEntry {
  id: string
  lead_id: string
  action: LeadAction
  from_stage_id: string | null
  to_stage_id: string | null
  metadata: Record<string, unknown>
  performed_by: string | null
  created_at: string
  from_stage?: {
    name: string
    color: string
  } | null
  to_stage?: {
    name: string
    color: string
  } | null
  user?: {
    id: string
    full_name: string
  } | null
}

class LeadHistoryService {
  /**
   * Record an action in the lead history
   */
  async record(data: RecordHistoryDTO): Promise<void> {
    const { error } = await supabase.from('lead_history').insert({
      lead_id: data.lead_id,
      action: data.action,
      from_stage_id: data.from_stage_id || null,
      to_stage_id: data.to_stage_id || null,
      metadata: data.metadata || {},
      performed_by: data.user_id || null,
    })

    if (error) {
      logger.error('Failed to record lead history', { error, data })
      // Don't throw - history recording shouldn't break the main operation
    }
  }

  /**
   * Get history for a lead
   */
  async getHistory(leadId: string, limit = 50): Promise<LeadHistoryEntry[]> {
    const { data, error } = await supabase
      .from('lead_history')
      .select(
        `
        *,
        from_stage:kanban_stages!lead_history_from_stage_id_fkey(name, color),
        to_stage:kanban_stages!lead_history_to_stage_id_fkey(name, color),
        user:users!lead_history_performed_by_fkey(id, full_name)
      `
      )
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Failed to get lead history', { error, leadId })
      return []
    }

    return data as LeadHistoryEntry[]
  }
}

export const leadHistoryService = new LeadHistoryService()
