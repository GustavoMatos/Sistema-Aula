import { useState } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Phone,
  MessageSquare,
  Calendar,
  Mail,
  MoreHorizontal,
  Check,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FollowupFormModal } from './FollowupFormModal'
import {
  useFollowups,
  useCompleteFollowup,
  useDeleteFollowup,
} from '@/hooks/useFollowups'
import type { Followup, FollowupFilters } from '@/lib/api'

interface FollowupListProps {
  leadId: string
  showCompleted?: boolean
}

const TYPE_ICONS = {
  call: Phone,
  message: MessageSquare,
  meeting: Calendar,
  email: Mail,
  other: Calendar,
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export function FollowupList({ leadId, showCompleted = false }: FollowupListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null)
  const [followupToDelete, setFollowupToDelete] = useState<Followup | null>(null)

  const filters: FollowupFilters = {
    lead_id: leadId,
    status: showCompleted ? 'all' : 'pending',
  }

  const { data, isLoading } = useFollowups(filters)
  const completeFollowup = useCompleteFollowup()
  const deleteFollowup = useDeleteFollowup()

  const handleEdit = (followup: Followup) => {
    setSelectedFollowup(followup)
    setIsFormOpen(true)
  }

  const handleComplete = (followup: Followup) => {
    completeFollowup.mutate(followup.id)
  }

  const handleDelete = () => {
    if (followupToDelete) {
      deleteFollowup.mutate(followupToDelete.id)
      setFollowupToDelete(null)
    }
  }

  const handleNewFollowup = () => {
    setSelectedFollowup(null)
    setIsFormOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    )
  }

  const followups = data?.followups || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Follow-ups</h3>
        <Button size="sm" onClick={handleNewFollowup}>
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>

      {followups.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          Nenhum follow-up agendado
        </p>
      ) : (
        <div className="space-y-2">
          {followups.map((followup) => {
            const Icon = TYPE_ICONS[followup.type]
            const dueDate = new Date(followup.due_date)
            const isOverdue =
              followup.status === 'pending' && isPast(dueDate) && !isToday(dueDate)
            const isDueToday = isToday(dueDate)

            return (
              <div
                key={followup.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  followup.status === 'completed'
                    ? 'bg-gray-50 opacity-60'
                    : isOverdue
                      ? 'bg-red-50 border-red-200'
                      : isDueToday
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white'
                }`}
              >
                <Checkbox
                  checked={followup.status === 'completed'}
                  onCheckedChange={() => {
                    if (followup.status !== 'completed') {
                      handleComplete(followup)
                    }
                  }}
                  disabled={followup.status === 'completed'}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span
                      className={`font-medium ${followup.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}
                    >
                      {followup.title}
                    </span>
                  </div>

                  {followup.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {followup.description}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                    >
                      {isOverdue && <AlertCircle className="h-3 w-3 inline mr-1" />}
                      {format(dueDate, "dd/MM 'as' HH:mm", { locale: ptBR })}
                    </span>
                    <Badge
                      variant="secondary"
                      className={PRIORITY_COLORS[followup.priority]}
                    >
                      {followup.priority === 'high'
                        ? 'Alta'
                        : followup.priority === 'medium'
                          ? 'Media'
                          : 'Baixa'}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {followup.status !== 'completed' && (
                      <DropdownMenuItem onClick={() => handleComplete(followup)}>
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como concluido
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleEdit(followup)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setFollowupToDelete(followup)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      )}

      <FollowupFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        leadId={leadId}
        followup={selectedFollowup}
      />

      <AlertDialog
        open={!!followupToDelete}
        onOpenChange={() => setFollowupToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir follow-up</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{followupToDelete?.title}"? Esta
              acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
