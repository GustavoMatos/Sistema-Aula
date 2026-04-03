import { Trash2, MoveRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useKanbanStages } from '@/hooks/useKanbanStages'
import { useBulkMoveStage, useBulkDeleteLeads } from '@/hooks/useLeads'

interface BulkActionsBarProps {
  selectedIds: string[]
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedIds,
  onClearSelection,
}: BulkActionsBarProps) {
  const { data: stages } = useKanbanStages()
  const bulkMove = useBulkMoveStage()
  const bulkDelete = useBulkDeleteLeads()

  const handleMoveToStage = (stageId: string) => {
    bulkMove.mutate(
      { leadIds: selectedIds, stageId },
      {
        onSuccess: () => {
          onClearSelection()
        },
      }
    )
  }

  const handleDelete = () => {
    bulkDelete.mutate(selectedIds, {
      onSuccess: () => {
        onClearSelection()
      },
    })
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-700">
          {selectedIds.length} lead(s) selecionado(s)
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <MoveRight className="h-4 w-4 text-gray-500" />
          <Select onValueChange={handleMoveToStage}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Mover para..." />
            </SelectTrigger>
            <SelectContent>
              {stages?.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir leads</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedIds.length} lead(s)?
                Esta acao nao pode ser desfeita.
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
    </div>
  )
}
