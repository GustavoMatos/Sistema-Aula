import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit: number) => [...dashboardKeys.all, 'activity', limit] as const,
}

// Get dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 60000, // Refresh every minute
  })
}

// Get recent activity
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => dashboardApi.getRecentActivity(limit),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}
