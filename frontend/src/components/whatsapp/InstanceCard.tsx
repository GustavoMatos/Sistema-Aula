import { Smartphone, LogOut, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import type { WhatsAppInstance } from '@/lib/api'

interface InstanceCardProps {
  instance: WhatsAppInstance
  onConnect: () => void
  onLogout: () => void
  onDelete: () => void
  isLoggingOut?: boolean
}

function formatPhoneNumber(phone: string | null): string {
  if (!phone) return 'Não conectado'

  // Format Brazilian number: +55 11 99999-9999
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4)
    const firstPart = cleaned.slice(4, 9)
    const secondPart = cleaned.slice(9)
    return `+55 ${ddd} ${firstPart}-${secondPart}`
  }

  return `+${cleaned}`
}

export function InstanceCard({
  instance,
  onConnect,
  onLogout,
  onDelete,
  isLoggingOut,
}: InstanceCardProps) {
  const isConnected = instance.status === 'connected'
  const isConnecting = instance.status === 'connecting'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{instance.instance_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatPhoneNumber(instance.phone_number)}
              </p>
            </div>
          </div>
          <StatusBadge status={instance.status} />
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Desconectar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {isConnecting ? 'Conectando...' : 'Conectar'}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remover
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
