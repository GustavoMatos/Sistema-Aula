import { supabase } from '../config/supabase.js'

export interface DashboardStats {
  totalLeads: number
  leadsThisMonth: number
  leadsLastMonth: number
  leadGrowth: number
  totalMessages: number
  messagesThisWeek: number
  pendingFollowups: number
  overdueFollowups: number
  leadsByStage: { stage: string; color: string; count: number }[]
  leadsBySource: { source: string; count: number }[]
  leadsOverTime: { date: string; count: number }[]
  messagesOverTime: { date: string; inbound: number; outbound: number }[]
  topLeads: {
    id: string
    name: string
    phone: string
    stage: string
    stageColor: string
    messageCount: number
  }[]
}

export interface ActivityItem {
  id: string
  type: 'lead_created' | 'message_sent' | 'message_received' | 'stage_change' | 'followup_completed'
  title: string
  description: string
  timestamp: string
  leadId?: string
  leadName?: string
}

class DashboardService {
  async getStats(workspaceId: string): Promise<DashboardStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Run all queries in parallel
    const [
      totalLeadsResult,
      leadsThisMonthResult,
      leadsLastMonthResult,
      totalMessagesResult,
      messagesThisWeekResult,
      pendingFollowupsResult,
      overdueFollowupsResult,
      leadsByStageResult,
      leadsBySourceResult,
      leadsOverTimeResult,
      messagesOverTimeResult,
      topLeadsResult,
    ] = await Promise.all([
      // Total leads
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),

      // Leads this month
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', startOfMonth.toISOString()),

      // Leads last month
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString()),

      // Total messages
      supabase
        .from('messages')
        .select('id, leads!inner(workspace_id)', { count: 'exact', head: true })
        .eq('leads.workspace_id', workspaceId),

      // Messages this week
      supabase
        .from('messages')
        .select('id, leads!inner(workspace_id)', { count: 'exact', head: true })
        .eq('leads.workspace_id', workspaceId)
        .gte('created_at', startOfWeek.toISOString()),

      // Pending followups
      supabase
        .from('followups')
        .select('id, leads!inner(workspace_id)', { count: 'exact', head: true })
        .eq('leads.workspace_id', workspaceId)
        .eq('status', 'pending')
        .gte('due_date', now.toISOString()),

      // Overdue followups
      supabase
        .from('followups')
        .select('id, leads!inner(workspace_id)', { count: 'exact', head: true })
        .eq('leads.workspace_id', workspaceId)
        .eq('status', 'pending')
        .lt('due_date', now.toISOString()),

      // Leads by stage
      supabase
        .from('leads')
        .select('stage_id, kanban_stages(name, color)')
        .eq('workspace_id', workspaceId),

      // Leads by source
      supabase
        .from('leads')
        .select('source')
        .eq('workspace_id', workspaceId),

      // Leads over time (last 30 days)
      this.getLeadsOverTime(workspaceId, 30),

      // Messages over time (last 7 days)
      this.getMessagesOverTime(workspaceId, 7),

      // Top leads by message count
      this.getTopLeads(workspaceId, 5),
    ])

    // Process leads by stage
    const stageCountMap = new Map<string, { name: string; color: string; count: number }>()
    if (leadsByStageResult.data) {
      for (const lead of leadsByStageResult.data) {
        const stage = lead.kanban_stages as unknown as { name: string; color: string } | null
        if (stage) {
          const key = stage.name
          const existing = stageCountMap.get(key)
          if (existing) {
            existing.count++
          } else {
            stageCountMap.set(key, { name: stage.name, color: stage.color, count: 1 })
          }
        }
      }
    }

    // Process leads by source
    const sourceCountMap = new Map<string, number>()
    if (leadsBySourceResult.data) {
      for (const lead of leadsBySourceResult.data) {
        const source = lead.source || 'Desconhecido'
        sourceCountMap.set(source, (sourceCountMap.get(source) || 0) + 1)
      }
    }

    const leadsThisMonth = leadsThisMonthResult.count || 0
    const leadsLastMonth = leadsLastMonthResult.count || 0
    const leadGrowth = leadsLastMonth > 0
      ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
      : leadsThisMonth > 0 ? 100 : 0

    return {
      totalLeads: totalLeadsResult.count || 0,
      leadsThisMonth,
      leadsLastMonth,
      leadGrowth,
      totalMessages: totalMessagesResult.count || 0,
      messagesThisWeek: messagesThisWeekResult.count || 0,
      pendingFollowups: pendingFollowupsResult.count || 0,
      overdueFollowups: overdueFollowupsResult.count || 0,
      leadsByStage: Array.from(stageCountMap.values()).map((s) => ({
        stage: s.name,
        color: s.color,
        count: s.count,
      })),
      leadsBySource: Array.from(sourceCountMap.entries()).map(([source, count]) => ({
        source,
        count,
      })),
      leadsOverTime: leadsOverTimeResult,
      messagesOverTime: messagesOverTimeResult,
      topLeads: topLeadsResult,
    }
  }

  private async getLeadsOverTime(
    workspaceId: string,
    days: number
  ): Promise<{ date: string; count: number }[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('leads')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const countMap = new Map<string, number>()

    // Initialize all dates with 0
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      countMap.set(date.toISOString().split('T')[0], 0)
    }

    // Count leads per day
    if (data) {
      for (const lead of data) {
        const date = new Date(lead.created_at).toISOString().split('T')[0]
        countMap.set(date, (countMap.get(date) || 0) + 1)
      }
    }

    return Array.from(countMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private async getMessagesOverTime(
    workspaceId: string,
    days: number
  ): Promise<{ date: string; inbound: number; outbound: number }[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('messages')
      .select('direction, created_at, leads!inner(workspace_id)')
      .eq('leads.workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const countMap = new Map<string, { inbound: number; outbound: number }>()

    // Initialize all dates
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      countMap.set(date.toISOString().split('T')[0], { inbound: 0, outbound: 0 })
    }

    // Count messages per day
    if (data) {
      for (const message of data) {
        const date = new Date(message.created_at).toISOString().split('T')[0]
        const entry = countMap.get(date) || { inbound: 0, outbound: 0 }
        if (message.direction === 'inbound') {
          entry.inbound++
        } else {
          entry.outbound++
        }
        countMap.set(date, entry)
      }
    }

    return Array.from(countMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private async getTopLeads(
    workspaceId: string,
    limit: number
  ): Promise<DashboardStats['topLeads']> {
    // Get leads with message count
    const { data: leads } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        phone,
        kanban_stages(name, color),
        messages(id)
      `)
      .eq('workspace_id', workspaceId)
      .limit(100)

    if (!leads) return []

    // Sort by message count and take top N
    const leadsWithCount = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      stage: (lead.kanban_stages as unknown as { name: string } | null)?.name || 'Sem estagio',
      stageColor: (lead.kanban_stages as unknown as { color: string } | null)?.color || '#gray',
      messageCount: Array.isArray(lead.messages) ? lead.messages.length : 0,
    }))

    return leadsWithCount
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, limit)
  }

  async getRecentActivity(workspaceId: string, limit = 10): Promise<ActivityItem[]> {
    // Get recent lead history entries
    const { data: history } = await supabase
      .from('lead_history')
      .select(`
        id,
        action,
        metadata,
        created_at,
        leads!inner(id, name, workspace_id)
      `)
      .eq('leads.workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!history) return []

    return history.map((entry) => {
      const lead = entry.leads as unknown as { id: string; name: string } | null
      const metadata = entry.metadata as Record<string, unknown>

      let title = ''
      let description = ''

      switch (entry.action) {
        case 'lead_created':
          title = 'Novo lead'
          description = `${lead?.name || 'Lead'} foi criado`
          break
        case 'stage_change':
          title = 'Mudanca de estagio'
          description = `${lead?.name || 'Lead'} movido para novo estagio`
          break
        case 'message_sent':
          title = 'Mensagem enviada'
          description = `Mensagem enviada para ${lead?.name || 'Lead'}`
          break
        case 'message_received':
          title = 'Mensagem recebida'
          description = `${lead?.name || 'Lead'} enviou uma mensagem`
          break
        default:
          title = entry.action.replace(/_/g, ' ')
          description = metadata?.preview as string || ''
      }

      return {
        id: entry.id,
        type: entry.action as ActivityItem['type'],
        title,
        description,
        timestamp: entry.created_at,
        leadId: lead?.id,
        leadName: lead?.name,
      }
    })
  }
}

export const dashboardService = new DashboardService()
