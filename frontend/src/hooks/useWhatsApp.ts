import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappApi } from '@/lib/api'

// Query keys
export const whatsappKeys = {
  all: ['whatsapp'] as const,
  instances: () => [...whatsappKeys.all, 'instances'] as const,
  instance: (id: string) => [...whatsappKeys.all, 'instance', id] as const,
  qrCode: (id: string) => [...whatsappKeys.all, 'qr', id] as const,
  status: (id: string) => [...whatsappKeys.all, 'status', id] as const,
}

// List instances
export function useWhatsAppInstances() {
  return useQuery({
    queryKey: whatsappKeys.instances(),
    queryFn: async () => {
      const { instances } = await whatsappApi.listInstances()
      return instances
    },
  })
}

// Get single instance
export function useWhatsAppInstance(id: string) {
  return useQuery({
    queryKey: whatsappKeys.instance(id),
    queryFn: () => whatsappApi.getInstance(id),
    enabled: !!id,
  })
}

// Get QR Code
export function useWhatsAppQRCode(id: string, enabled = true) {
  return useQuery({
    queryKey: whatsappKeys.qrCode(id),
    queryFn: () => whatsappApi.getQRCode(id),
    enabled: !!id && enabled,
    refetchInterval: 30000, // Refresh QR every 30 seconds
  })
}

// Get status
export function useWhatsAppStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: whatsappKeys.status(id),
    queryFn: () => whatsappApi.getStatus(id),
    enabled: !!id && enabled,
    refetchInterval: 3000, // Poll every 3 seconds
  })
}

// Create instance
export function useCreateInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => whatsappApi.createInstance(name),
    onSuccess: (newInstance) => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() })
      return newInstance
    },
  })
}

// Delete instance
export function useDeleteInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => whatsappApi.deleteInstance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() })
    },
  })
}

// Logout instance
export function useLogoutInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => whatsappApi.logoutInstance(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() })
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status(id) })
    },
  })
}
