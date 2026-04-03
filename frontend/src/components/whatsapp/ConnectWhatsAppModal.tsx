import { useState, useEffect } from 'react'
import { Smartphone, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeDisplay } from './QRCodeDisplay'
import {
  useCreateInstance,
  useWhatsAppQRCode,
  useWhatsAppStatus,
} from '@/hooks/useWhatsApp'

type Step = 'name' | 'qr' | 'connected'

interface ConnectWhatsAppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** If provided, skip to QR step for reconnection */
  existingInstance?: { id: string; instance_name: string } | null
}

export function ConnectWhatsAppModal({
  open,
  onOpenChange,
  onSuccess,
  existingInstance,
}: ConnectWhatsAppModalProps) {
  const [step, setStep] = useState<Step>('name')
  const [instanceName, setInstanceName] = useState('')
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const createInstance = useCreateInstance()

  // If existing instance provided, go directly to QR step
  useEffect(() => {
    if (open && existingInstance) {
      setInstanceId(existingInstance.id)
      setInstanceName(existingInstance.instance_name)
      setStep('qr')
    }
  }, [open, existingInstance])

  // Only fetch QR code when we have an instance and are on QR step
  const {
    data: qrData,
    isLoading: qrLoading,
    error: qrError,
    refetch: refetchQR,
  } = useWhatsAppQRCode(instanceId || '', step === 'qr' && !!instanceId)

  // Poll connection status every 3 seconds when on QR step
  const { data: statusData } = useWhatsAppStatus(
    instanceId || '',
    step === 'qr' && !!instanceId
  )

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('name')
      setInstanceName('')
      setInstanceId(null)
      setNameError(null)
    }
  }, [open])

  // Watch for connection success
  useEffect(() => {
    if (statusData?.status === 'connected' && step === 'qr') {
      setStep('connected')
      toast.success('WhatsApp conectado com sucesso!')
      // Auto close after showing success
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 2000)
    }
  }, [statusData?.status, step, onOpenChange, onSuccess])

  const validateName = (name: string): boolean => {
    if (name.length < 3) {
      setNameError('Nome deve ter pelo menos 3 caracteres')
      return false
    }
    if (name.length > 50) {
      setNameError('Nome deve ter no máximo 50 caracteres')
      return false
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setNameError('Nome só pode conter letras, números, _ e -')
      return false
    }
    setNameError(null)
    return true
  }

  const handleCreateInstance = async () => {
    if (!validateName(instanceName)) return

    try {
      const instance = await createInstance.mutateAsync(instanceName)
      setInstanceId(instance.id)
      setStep('qr')
    } catch (error) {
      console.error('Failed to create instance:', error)
      setNameError('Erro ao criar instância. Tente outro nome.')
      toast.error('Erro ao criar instância')
    }
  }

  const handleBack = () => {
    // Only allow going back when creating new instance
    if (!existingInstance) {
      setStep('name')
      setInstanceId(null)
    }
  }

  const isReconnecting = !!existingInstance

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'qr' && !isReconnecting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 p-1 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Smartphone className="w-5 h-5 text-green-600" />
            {step === 'name' && 'Conectar WhatsApp'}
            {step === 'qr' && (isReconnecting ? `Reconectar ${instanceName}` : 'Escaneie o QR Code')}
            {step === 'connected' && 'Conectado!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'name' && 'Dê um nome para identificar esta conexão'}
            {step === 'qr' && 'Use o WhatsApp do seu celular para escanear'}
            {step === 'connected' && 'WhatsApp conectado com sucesso'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Instance Name */}
          {step === 'name' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instance-name">Nome da Instância</Label>
                <Input
                  id="instance-name"
                  placeholder="Ex: principal, vendas, suporte"
                  value={instanceName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setInstanceName(e.target.value)
                    if (nameError) validateName(e.target.value)
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleCreateInstance()
                  }}
                  className={nameError ? 'border-red-500' : ''}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleCreateInstance}
                disabled={!instanceName || createInstance.isPending}
              >
                {createInstance.isPending ? 'Criando...' : 'Continuar'}
              </Button>
            </div>
          )}

          {/* Step 2: QR Code */}
          {step === 'qr' && (
            <QRCodeDisplay
              qrCode={qrData?.qrCode || null}
              pairingCode={qrData?.pairingCode}
              isLoading={qrLoading}
              error={qrError}
              onRefresh={() => refetchQR()}
            />
          )}

          {/* Step 3: Connected */}
          {step === 'connected' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                WhatsApp Conectado!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {statusData?.phoneNumber || 'Número conectado'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
