import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KanbanCard } from './KanbanCard'
import type { KanbanColumn as KanbanColumnType } from '@/lib/api'

interface KanbanColumnProps {
  column: KanbanColumnType
  onEditStage?: (column: KanbanColumnType) => void
  onDeleteStage?: (column: KanbanColumnType) => void
  onAddLead?: (stageId: string) => void
}

export function KanbanColumn({
  column,
  onEditStage,
  onDeleteStage,
  onAddLead,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  return (
    <div className="flex flex-col w-80 min-w-[320px] bg-gray-50 rounded-lg">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{ borderBottomColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-200 rounded-full">
            {column.lead_count}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAddLead?.(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditStage?.(column)}>
                Editar estagio
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDeleteStage?.(column)}
              >
                Excluir estagio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext
          items={column.leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {column.leads.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            Nenhum lead neste estagio
          </div>
        )}
      </div>
    </div>
  )
}
