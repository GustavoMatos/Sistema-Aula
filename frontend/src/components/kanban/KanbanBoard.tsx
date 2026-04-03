import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { useMoveLeadStage } from '@/hooks/useLeads'
import type { KanbanColumn as KanbanColumnType } from '@/lib/api'

interface KanbanBoardProps {
  columns: KanbanColumnType[]
  onEditStage?: (column: KanbanColumnType) => void
  onDeleteStage?: (column: KanbanColumnType) => void
  onAddLead?: (stageId: string) => void
}

export function KanbanBoard({
  columns,
  onEditStage,
  onDeleteStage,
  onAddLead,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const moveLeadStage = useMoveLeadStage()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeLead = useMemo(() => {
    if (!activeId) return null
    for (const column of columns) {
      const lead = column.leads.find((l) => l.id === activeId)
      if (lead) return lead
    }
    return null
  }, [activeId, columns])

  const findColumnByLeadId = (leadId: string): KanbanColumnType | null => {
    return columns.find((col) => col.leads.some((l) => l.id === leadId)) || null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeLeadId = active.id as string
    const overId = over.id as string

    // Find source column
    const sourceColumn = findColumnByLeadId(activeLeadId)
    if (!sourceColumn) return

    // Determine target column
    let targetColumnId: string | null = null

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId)
    if (targetColumn) {
      targetColumnId = targetColumn.id
    } else {
      // Dropped on another lead, find its column
      const overColumn = findColumnByLeadId(overId)
      if (overColumn) {
        targetColumnId = overColumn.id
      }
    }

    // If no target column found or same column, do nothing
    if (!targetColumnId || targetColumnId === sourceColumn.id) return

    // Move lead to new stage
    moveLeadStage.mutate({
      id: activeLeadId,
      stageId: targetColumnId,
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onEditStage={onEditStage}
            onDeleteStage={onDeleteStage}
            onAddLead={onAddLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3">
            <KanbanCard lead={activeLead} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
