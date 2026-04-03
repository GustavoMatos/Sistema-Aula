import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leadsApi } from '@/lib/api'
import type { LeadFilters, CreateLeadDTO, UpdateLeadDTO } from '@/lib/api'

// Query keys
export const leadsKeys = {
  all: ['leads'] as const,
  list: (filters: LeadFilters) => [...leadsKeys.all, 'list', filters] as const,
  detail: (id: string) => [...leadsKeys.all, 'detail', id] as const,
  history: (id: string) => [...leadsKeys.all, 'history', id] as const,
}

// List leads with filters
export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: leadsKeys.list(filters),
    queryFn: () => leadsApi.list(filters),
    placeholderData: (previousData) => previousData,
  })
}

// Get single lead
export function useLead(id: string) {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  })
}

// Get lead history
export function useLeadHistory(id: string) {
  return useQuery({
    queryKey: leadsKeys.history(id),
    queryFn: () => leadsApi.getHistory(id),
    enabled: !!id,
  })
}

// Create lead
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeadDTO) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      toast.success('Lead criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar lead')
    },
  })
}

// Update lead
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadDTO }) =>
      leadsApi.update(id, data),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      queryClient.setQueryData(leadsKeys.detail(lead.id), lead)
      toast.success('Lead atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar lead')
    },
  })
}

// Delete lead
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      toast.success('Lead excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir lead')
    },
  })
}

// Move lead to stage
export function useMoveLeadStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      leadsApi.moveStage(id, stageId),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      queryClient.setQueryData(leadsKeys.detail(lead.id), lead)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao mover lead')
    },
  })
}

// Bulk move leads to stage
export function useBulkMoveStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadIds, stageId }: { leadIds: string[]; stageId: string }) => {
      const results = await Promise.allSettled(
        leadIds.map((id) => leadsApi.moveStage(id, stageId))
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) {
        throw new Error(`${failed} lead(s) falharam ao mover`)
      }

      return results
    },
    onSuccess: (_, { leadIds }) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      toast.success(`${leadIds.length} lead(s) movido(s) com sucesso!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao mover leads')
    },
  })
}

// Bulk delete leads
export function useBulkDeleteLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const results = await Promise.allSettled(
        leadIds.map((id) => leadsApi.delete(id))
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) {
        throw new Error(`${failed} lead(s) falharam ao excluir`)
      }

      return results
    },
    onSuccess: (_, leadIds) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      toast.success(`${leadIds.length} lead(s) excluído(s) com sucesso!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir leads')
    },
  })
}

// Import leads from CSV
export function useImportLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => leadsApi.import(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
      toast.success(
        `Importação concluída: ${result.imported} importados, ${result.duplicates} duplicados, ${result.errors.length} erros`
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao importar leads')
    },
  })
}
