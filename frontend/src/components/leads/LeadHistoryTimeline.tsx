import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  UserPlus,
  ArrowRight,
  Edit,
  StickyNote,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Trash2,
  Upload,
} from 'lucide-react'
import { useLeadHistory } from '@/hooks/useLeads'

interface HistoryEntry {
  id: string
  lead_id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
  user_id: string | null
}

interface LeadHistoryTimelineProps {
  leadId: string
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  lead_created: { icon: UserPlus, label: 'Lead criado', color: 'text-green-500' },
  stage_change: { icon: ArrowRight, label: 'Movido de estagio', color: 'text-blue-500' },
  lead_updated: { icon: Edit, label: 'Lead atualizado', color: 'text-gray-500' },
  note_added: { icon: StickyNote, label: 'Nota adicionada', color: 'text-yellow-500' },
  message_sent: { icon: MessageSquare, label: 'Mensagem enviada', color: 'text-purple-500' },
  message_received: { icon: MessageSquare, label: 'Mensagem recebida', color: 'text-indigo-500' },
  call_made: { icon: Phone, label: 'Ligacao realizada', color: 'text-cyan-500' },
  email_sent: { icon: Mail, label: 'Email enviado', color: 'text-pink-500' },
  meeting_scheduled: { icon: Calendar, label: 'Reuniao agendada', color: 'text-orange-500' },
  lead_deleted: { icon: Trash2, label: 'Lead excluido', color: 'text-red-500' },
  lead_imported: { icon: Upload, label: 'Lead importado', color: 'text-teal-500' },
}

function getActionDetails(action: string, details: Record<string, unknown> | null): string | null {
  if (!details) return null

  switch (action) {
    case 'stage_change':
      return `De "${details.from_stage || 'Sem estagio'}" para "${details.to_stage || 'Novo estagio'}"`
    case 'lead_updated':
      if (details.changed_fields) {
        const fields = details.changed_fields as string[]
        return `Campos alterados: ${fields.join(', ')}`
      }
      return null
    case 'message_sent':
    case 'message_received':
      if (details.preview) {
        return `"${details.preview}"`
      }
      return null
    default:
      return null
  }
}

export function LeadHistoryTimeline({ leadId }: LeadHistoryTimelineProps) {
  const { data, isLoading, error } = useLeadHistory(leadId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-center text-gray-500 py-8">
        Erro ao carregar historico
      </p>
    )
  }

  const history = (data?.history || []) as HistoryEntry[]

  if (history.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        Nenhuma interacao registrada ainda
      </p>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((entry, index) => {
          const config = ACTION_CONFIG[entry.action] || {
            icon: Edit,
            label: entry.action,
            color: 'text-gray-500',
          }
          const Icon = config.icon
          const details = getActionDetails(entry.action, entry.details)
          const isLast = index === history.length - 1

          return (
            <li key={entry.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-white ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-900">
                        {config.label}
                      </p>
                      {details && (
                        <p className="mt-1 text-sm text-gray-500">
                          {details}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {format(new Date(entry.created_at), "dd/MM/yy 'as' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
