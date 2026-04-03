import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kanbanApi } from '@/lib/api'
import type { CreateStageDTO, UpdateStageDTO } from '@/lib/api'

// Query keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  board: () => [...kanbanKeys.all, 'board'] as const,
  stages: () => [...kanbanKeys.all, 'stages'] as const,
  stage: (id: string) => [...kanbanKeys.all, 'stage', id] as const,
}

// Get kanban board
export function useKanbanBoard() {
  return useQuery({
    queryKey: kanbanKeys.board(),
    queryFn: () => kanbanApi.getBoard(),
  })
}

// List stages
export function useKanbanStagesList() {
  return useQuery({
    queryKey: kanbanKeys.stages(),
    queryFn: () => kanbanApi.listStages(),
  })
}

// Create stage
export function useCreateStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStageDTO) => kanbanApi.createStage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })
      toast.success('Estagio criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar estagio')
    },
  })
}

// Update stage
export function useUpdateStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStageDTO }) =>
      kanbanApi.updateStage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })
      toast.success('Estagio atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar estagio')
    },
  })
}

// Delete stage
export function useDeleteStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => kanbanApi.deleteStage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })
      toast.success('Estagio excluido com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir estagio')
    },
  })
}

// Reorder stages
export function useReorderStages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (stages: Array<{ id: string; position: number }>) =>
      kanbanApi.reorderStages(stages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reordenar estagios')
    },
  })
}
