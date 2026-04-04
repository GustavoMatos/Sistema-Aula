import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard'
import { Users, MessageSquare, TrendingUp, Clock, Loader2 } from 'lucide-react'

export function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: activity } = useRecentActivity(5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-muted-foreground">Total de Leads</p>
          </div>
          <p className="text-3xl font-bold mt-2">{stats?.totalLeads || 0}</p>
          {stats?.leadGrowth !== undefined && stats.leadGrowth > 0 && (
            <p className="text-sm text-green-500 mt-1">+{stats.leadGrowth}% este mês</p>
          )}
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-sm text-muted-foreground">Leads este Mês</p>
          </div>
          <p className="text-3xl font-bold mt-2">{stats?.leadsThisMonth || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">
            vs {stats?.leadsLastMonth || 0} mês anterior
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <p className="text-sm text-muted-foreground">Total de Mensagens</p>
          </div>
          <p className="text-3xl font-bold mt-2">{stats?.totalMessages || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {stats?.messagesThisWeek || 0} esta semana
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">Follow-ups Pendentes</p>
          </div>
          <p className="text-3xl font-bold mt-2">{stats?.pendingFollowups || 0}</p>
          {(stats?.overdueFollowups || 0) > 0 && (
            <p className="text-sm text-red-500 mt-1">
              {stats.overdueFollowups} atrasados
            </p>
          )}
        </div>
      </div>

      {/* Leads by Stage */}
      {stats?.leadsByStage && stats.leadsByStage.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Leads por Estágio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {stats.leadsByStage.map((stage) => (
              <div
                key={stage.stage}
                className="bg-card rounded-lg border p-4 text-center"
                style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
              >
                <p className="text-2xl font-bold">{stage.count}</p>
                <p className="text-sm text-muted-foreground truncate">{stage.stage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Leads */}
      {stats?.topLeads && stats.topLeads.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Leads Mais Ativos</h2>
          <div className="bg-card rounded-lg border divide-y">
            {stats.topLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: lead.stageColor }}
                  >
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{lead.messageCount} msgs</p>
                  <p className="text-sm text-muted-foreground">{lead.stage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {activity && activity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
          <div className="bg-card rounded-lg border divide-y">
            {activity.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
