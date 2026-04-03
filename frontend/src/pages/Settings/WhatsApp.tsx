import { useState } from 'react'
import { Plus, RefreshCw, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  InstanceCard,
  DeleteInstanceDialog,
  ConnectWhatsAppModal,
} from '@/components/whatsapp'
import {
  useWhatsAppInstances,
  useDeleteInstance,
  useLogoutInstance,
} from '@/hooks/useWhatsApp'
import type { WhatsAppInstance } from '@/lib/api'

export default function WhatsAppSettings() {
  const [instanceToDelete, setInstanceToDelete] = useState<WhatsAppInstance | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [instanceToReconnect, setInstanceToReconnect] = useState<WhatsAppInstance | null>(null)

  const { data: instances, isLoading, error, refetch } = useWhatsAppInstances()
  const deleteInstance = useDeleteInstance()
  const logoutInstance = useLogoutInstance()

  const handleDelete = async () => {
    if (!instanceToDelete) return

    try {
      await deleteInstance.mutateAsync(instanceToDelete.id)
      setInstanceToDelete(null)
    } catch (error) {
      console.error('Failed to delete instance:', error)
    }
  }

  const handleLogout = async (instance: WhatsAppInstance) => {
    try {
      await logoutInstance.mutateAsync(instance.id)
    } catch (error) {
      console.error('Failed to logout instance:', error)
    }
  }

  const handleConnect = (instance: WhatsAppInstance) => {
    setInstanceToReconnect(instance)
    setShowConnectModal(true)
  }

  const handleCreateNew = () => {
    setInstanceToReconnect(null)
    setShowConnectModal(true)
  }

  const handleConnectSuccess = () => {
    refetch()
    setInstanceToReconnect(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-500 mt-1">
            Gerencie suas conexões com o WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Conectar WhatsApp
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Carregando instâncias...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Erro ao carregar instâncias. Por favor, tente novamente.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && instances?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma instância conectada
          </h3>
          <p className="text-gray-500 mb-4">
            Conecte seu WhatsApp para começar a enviar mensagens
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Conectar WhatsApp
          </Button>
        </div>
      )}

      {/* Instances list */}
      {!isLoading && instances && instances.length > 0 && (
        <div className="space-y-4">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onConnect={() => handleConnect(instance)}
              onLogout={() => handleLogout(instance)}
              onDelete={() => setInstanceToDelete(instance)}
              isLoggingOut={logoutInstance.isPending}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteInstanceDialog
        instance={instanceToDelete}
        open={!!instanceToDelete}
        onOpenChange={(open) => !open && setInstanceToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteInstance.isPending}
      />

      {/* Connect WhatsApp modal */}
      <ConnectWhatsAppModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onSuccess={handleConnectSuccess}
        existingInstance={instanceToReconnect}
      />
    </div>
  )
}
