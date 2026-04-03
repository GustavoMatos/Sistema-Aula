import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { followupsApi } from '@/lib/api'
import type { FollowupFilters, CreateFollowupDTO, UpdateFollowupDTO } from '@/lib/api'

// Query keys
export const followupsKeys = {
  all: ['followups'] as const,
  list: (filters: FollowupFilters) => [...followupsKeys.all, 'list', filters] as const,
  detail: (id: string) => [...followupsKeys.all, 'detail', id] as const,
  today: () => [...followupsKeys.all, 'today'] as const,
  overdue: () => [...followupsKeys.all, 'overdue'] as const,
  counts: () => [...followupsKeys.all, 'counts'] as const,
}

// List followups with filters
export function useFollowups(filters: FollowupFilters = {}) {
  return useQuery({
    queryKey: followupsKeys.list(filters),
    queryFn: () => followupsApi.list(filters),
    placeholderData: (previousData) => previousData,
  })
}

// Get single followup
export function useFollowup(id: string) {
  return useQuery({
    queryKey: followupsKeys.detail(id),
    queryFn: () => followupsApi.getById(id),
    enabled: !!id,
  })
}

// Get today's followups
export function useTodayFollowups() {
  return useQuery({
    queryKey: followupsKeys.today(),
    queryFn: () => followupsApi.getToday(),
  })
}

// Get overdue followups
export function useOverdueFollowups() {
  return useQuery({
    queryKey: followupsKeys.overdue(),
    queryFn: () => followupsApi.getOverdue(),
  })
}

// Get followup counts
export function useFollowupCounts() {
  return useQuery({
    queryKey: followupsKeys.counts(),
    queryFn: () => followupsApi.getCounts(),
  })
}

// Create followup
export function useCreateFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFollowupDTO) => followupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all })
      toast.success('Follow-up criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar follow-up')
    },
  })
}

// Update followup
export function useUpdateFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFollowupDTO }) =>
      followupsApi.update(id, data),
    onSuccess: (followup) => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all })
      queryClient.setQueryData(followupsKeys.detail(followup.id), followup)
      toast.success('Follow-up atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar follow-up')
    },
  })
}

// Delete followup
export function useDeleteFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => followupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all })
      toast.success('Follow-up excluido com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir follow-up')
    },
  })
}

// Complete followup
export function useCompleteFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => followupsApi.complete(id),
    onSuccess: (followup) => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all })
      queryClient.setQueryData(followupsKeys.detail(followup.id), followup)
      toast.success('Follow-up concluido!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao concluir follow-up')
    },
  })
}
