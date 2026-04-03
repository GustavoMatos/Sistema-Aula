import { RefreshCw, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface QRCodeDisplayProps {
  qrCode: string | null
  pairingCode?: string | null
  isLoading: boolean
  error?: Error | null
  onRefresh?: () => void
}

export function QRCodeDisplay({
  qrCode,
  pairingCode,
  isLoading,
  error,
  onRefresh,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (!pairingCode) return

    try {
      await navigator.clipboard.writeText(pairingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-sm text-gray-500">Gerando QR Code...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 text-sm mb-2">
            Erro ao gerar QR Code
          </p>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-sm text-gray-500">QR Code não disponível</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* QR Code Image */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
        <img
          src={qrCode}
          alt="QR Code WhatsApp"
          className="w-64 h-64"
        />
      </div>

      {/* Instructions */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Abra o WhatsApp no seu celular
        </p>
        <p className="text-sm text-gray-600">
          Vá em <strong>Configurações → Dispositivos Vinculados</strong>
        </p>
        <p className="text-sm text-gray-600">
          Toque em <strong>Vincular Dispositivo</strong> e escaneie o QR Code
        </p>
      </div>

      {/* Pairing Code Alternative */}
      {pairingCode && (
        <div className="w-full border-t pt-4 mt-2">
          <p className="text-xs text-gray-500 text-center mb-2">
            Ou use o código de pareamento:
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-100 px-4 py-2 rounded-lg text-lg font-mono tracking-widest">
              {pairingCode}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Refresh button */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="mt-4 text-gray-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar QR Code
        </Button>
      )}
    </div>
  )
}
