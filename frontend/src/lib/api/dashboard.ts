import { apiClient } from './client'

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

export interface ActivityResponse {
  activity: ActivityItem[]
}

export const dashboardApi = {
  // Get dashboard stats
  getStats: async (): Promise<DashboardStats> => {
    return apiClient.get('/api/dashboard/stats')
  },

  // Get recent activity
  getRecentActivity: async (limit = 10): Promise<ActivityResponse> => {
    return apiClient.get(`/api/dashboard/activity?limit=${limit}`)
  },
}
