import { Link } from 'react-router-dom'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TopLead {
  id: string
  name: string
  phone: string
  stage: string
  stageColor: string
  messageCount: number
}

interface TopLeadsProps {
  leads: TopLead[]
  isLoading?: boolean
}

export function TopLeads({ leads, isLoading }: TopLeadsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Leads</CardTitle>
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
        <CardTitle>Top Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum lead com mensagens
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead, index) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: lead.stageColor,
                        color: lead.stageColor,
                      }}
                    >
                      {lead.stage}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare className="h-3 w-3" />
                      {lead.messageCount}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
