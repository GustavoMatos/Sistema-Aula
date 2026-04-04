import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit: number) => [...dashboardKeys.all, 'activity', limit] as const,
}

// Get dashboard stats with realtime updates
export function useDashboardStats() {
  const queryClient = useQueryClient()

  // Subscribe to realtime changes on leads and messages
  useEffect(() => {
    const channel = supabase
      .channel('dashboard:stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}

// Get recent activity with realtime updates
export function useRecentActivity(limit = 10) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('dashboard:activity')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lead_history' },
        () => {
          queryClient.invalidateQueries({ queryKey: dashboardKeys.activity(limit) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, limit])

  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => dashboardApi.getRecentActivity(limit),
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}
