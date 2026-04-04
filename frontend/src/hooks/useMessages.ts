import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { messagesApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { SendMessageDTO } from '@/lib/api'

// Query keys
export const messagesKeys = {
  all: ['messages'] as const,
  lead: (leadId: string) => [...messagesKeys.all, 'lead', leadId] as const,
  message: (id: string) => [...messagesKeys.all, id] as const,
}

// Get messages for a lead with realtime updates
export function useLeadMessages(
  leadId: string,
  options?: { limit?: number; offset?: number }
) {
  const queryClient = useQueryClient()

  // Subscribe to realtime changes
  useEffect(() => {
    if (!leadId) return

    const channel = supabase
      .channel(`messages:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          // Invalidate query to refetch messages
          queryClient.invalidateQueries({
            queryKey: messagesKeys.lead(leadId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId, queryClient])

  return useQuery({
    queryKey: messagesKeys.lead(leadId),
    queryFn: () => messagesApi.getByLead(leadId, options),
    enabled: !!leadId,
    refetchInterval: 5000, // Polling every 5 seconds as fallback
  })
}

// Get single message
export function useMessage(id: string) {
  return useQuery({
    queryKey: messagesKeys.message(id),
    queryFn: () => messagesApi.getById(id),
    enabled: !!id,
  })
}

// Send message mutation
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessageDTO) => messagesApi.send(data),
    onSuccess: (message) => {
      // Invalidate lead messages to refresh the list
      queryClient.invalidateQueries({
        queryKey: messagesKeys.lead(message.lead_id),
      })
    },
    onError: (error: Error) => {
      if (error.message?.includes('Nenhuma instância WhatsApp')) {
        toast.error('Nenhuma instância WhatsApp conectada')
      } else if (error.message?.includes('Lead não encontrado')) {
        toast.error('Lead não encontrado')
      } else if (error.message?.includes('não possui número')) {
        toast.error('Lead não possui número de telefone')
      } else {
        toast.error('Erro ao enviar mensagem')
      }
    },
  })
}
