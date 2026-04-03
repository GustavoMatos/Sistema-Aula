import { Users, MessageSquare, Calendar, AlertCircle } from 'lucide-react'
import {
  StatsCard,
  LeadsByStageChart,
  LeadsBySourceChart,
  RecentActivity,
  TopLeads,
} from '@/components/dashboard'
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard'

export function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats()
  const { data: activityData, isLoading: isLoadingActivity } = useRecentActivity(10)

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visao geral do seu CRM</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Leads"
          value={stats?.totalLeads || 0}
          icon={Users}
          trend={
            stats?.leadGrowth !== undefined
              ? { value: stats.leadGrowth, label: 'vs mes anterior' }
              : undefined
          }
        />
        <StatsCard
          title="Mensagens"
          value={stats?.totalMessages || 0}
          icon={MessageSquare}
          description={`${stats?.messagesThisWeek || 0} esta semana`}
        />
        <StatsCard
          title="Follow-ups Pendentes"
          value={stats?.pendingFollowups || 0}
          icon={Calendar}
          description="Agendados"
        />
        <StatsCard
          title="Follow-ups Atrasados"
          value={stats?.overdueFollowups || 0}
          icon={AlertCircle}
          className={
            stats?.overdueFollowups && stats.overdueFollowups > 0
              ? 'border-red-200 bg-red-50'
              : ''
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsByStageChart data={stats?.leadsByStage || []} />
        <LeadsBySourceChart data={stats?.leadsBySource || []} />
      </div>

      {/* Activity and Top Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity
          activity={activityData?.activity || []}
          isLoading={isLoadingActivity}
        />
        <TopLeads
          leads={stats?.topLeads || []}
          isLoading={isLoadingStats}
        />
      </div>
    </div>
  )
}
