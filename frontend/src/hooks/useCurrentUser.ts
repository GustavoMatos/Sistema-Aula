import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi, type UserProfile } from '@/lib/api/users'

export function useCurrentUser() {
  const { user: authUser, loading: authLoading } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['currentUser', authUser?.id],
    queryFn: async (): Promise<UserProfile> => {
      const res = await usersApi.getMe()
      return res.user
    },
    enabled: !!authUser && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    currentUser: data ?? null,
    isLoading: authLoading || isLoading,
    error,
    isSuperadmin: data?.role === 'superadmin',
    isAdminTenant: data?.role === 'admin_tenant',
    isUserTenant: data?.role === 'user_tenant',
  }
}
