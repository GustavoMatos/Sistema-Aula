import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GripVertical, Phone, Building2, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import type { KanbanLead } from '@/lib/api'

interface KanbanCardProps {
  lead: KanbanLead
  isDragging?: boolean
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function KanbanCard({ lead, isDragging }: KanbanCardProps) {
  const navigate = useNavigate()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if dragging
    if (isDragging) return

    // Check if the drag handle was clicked
    const target = e.target as HTMLElement
    if (target.closest('[data-drag-handle]')) return

    navigate(`/leads/${lead.id}`)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            data-drag-handle
            className="p-1 -ml-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{lead.name}</h4>

            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                <span>{formatPhone(lead.phone)}</span>
              </div>

              {lead.company && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{lead.company}</span>
                </div>
              )}

              {lead.potential_value && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatCurrency(lead.potential_value)}</span>
                </div>
              )}
            </div>

            {lead.last_contact_at && (
              <p className="mt-2 text-xs text-gray-400">
                {formatDistanceToNow(new Date(lead.last_contact_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
