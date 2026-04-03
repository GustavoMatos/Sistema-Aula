import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  UserPlus,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityItem } from '@/lib/api'

interface RecentActivityProps {
  activity: ActivityItem[]
  isLoading?: boolean
}

const ACTIVITY_ICONS = {
  lead_created: UserPlus,
  message_sent: MessageSquare,
  message_received: MessageSquare,
  stage_change: ArrowRight,
  followup_completed: CheckCircle,
}

const ACTIVITY_COLORS = {
  lead_created: 'bg-green-100 text-green-600',
  message_sent: 'bg-blue-100 text-blue-600',
  message_received: 'bg-purple-100 text-purple-600',
  stage_change: 'bg-yellow-100 text-yellow-600',
  followup_completed: 'bg-teal-100 text-teal-600',
}

export function RecentActivity({ activity, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => {
              const Icon = ACTIVITY_ICONS[item.type] || MessageSquare
              const colorClass = ACTIVITY_COLORS[item.type] || 'bg-gray-100 text-gray-600'

              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {item.description}
                    </p>
                    {item.leadId && (
                      <Link
                        to={`/leads/${item.leadId}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver lead
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
