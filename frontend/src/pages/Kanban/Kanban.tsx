import { useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { StageFormModal } from '@/components/kanban/StageFormModal'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { useKanbanBoard, useDeleteStage } from '@/hooks/useKanban'
import type { KanbanColumn, KanbanStage } from '@/lib/api'

export function Kanban() {
  const [isStageModalOpen, setIsStageModalOpen] = useState(false)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<KanbanStage | null>(null)
  const [stageToDelete, setStageToDelete] = useState<KanbanColumn | null>(null)

  const { data, isLoading, error } = useKanbanBoard()
  const deleteStage = useDeleteStage()

  const handleEditStage = (column: KanbanColumn) => {
    setSelectedStage(column)
    setIsStageModalOpen(true)
  }

  const handleDeleteStage = (column: KanbanColumn) => {
    setStageToDelete(column)
  }

  const confirmDeleteStage = async () => {
    if (stageToDelete) {
      await deleteStage.mutateAsync(stageToDelete.id)
      setStageToDelete(null)
    }
  }

  const handleAddLead = (_stageId: string) => {
    setIsLeadModalOpen(true)
  }

  const handleNewStage = () => {
    setSelectedStage(null)
    setIsStageModalOpen(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Erro ao carregar kanban: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban</h1>
          <p className="text-gray-500">Visualize e gerencie seus leads por estagio</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleNewStage}>
            <Settings className="h-4 w-4 mr-2" />
            Novo Estagio
          </Button>
          <Button onClick={() => setIsLeadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : data?.columns && data.columns.length > 0 ? (
        <KanbanBoard
          columns={data.columns}
          onEditStage={handleEditStage}
          onDeleteStage={handleDeleteStage}
          onAddLead={handleAddLead}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="mb-4">Nenhum estagio configurado ainda</p>
          <Button onClick={handleNewStage}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro estagio
          </Button>
        </div>
      )}

      {/* Stage Form Modal */}
      <StageFormModal
        open={isStageModalOpen}
        onOpenChange={setIsStageModalOpen}
        stage={selectedStage}
      />

      {/* Lead Form Modal */}
      <LeadFormModal
        open={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
      />

      {/* Delete Stage Confirmation */}
      <AlertDialog open={!!stageToDelete} onOpenChange={() => setStageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estagio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o estagio "{stageToDelete?.name}"?
              {stageToDelete?.lead_count && stageToDelete.lead_count > 0 && (
                <span className="block mt-2 text-red-600">
                  Este estagio contem {stageToDelete.lead_count} lead(s). Mova-os primeiro antes de excluir.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStage}
              className="bg-red-600 hover:bg-red-700"
              disabled={Boolean(stageToDelete?.lead_count && stageToDelete.lead_count > 0)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
