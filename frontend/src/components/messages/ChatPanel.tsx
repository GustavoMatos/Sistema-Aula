import { MessageSquare, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageList } from './MessageList'
import { MessageComposer } from './MessageComposer'
import { useLeadMessages } from '@/hooks/useMessages'
import { useWhatsAppInstances } from '@/hooks/useWhatsApp'

interface ChatPanelProps {
  leadId: string
  leadName: string
  leadPhone: string
}

export function ChatPanel({ leadId, leadName, leadPhone }: ChatPanelProps) {
  const { data, isLoading, error, refetch } = useLeadMessages(leadId)
  const { data: instances } = useWhatsAppInstances()

  const messages = data?.messages || []
  const hasConnectedInstance = instances?.some(
    (instance) => instance.status === 'connected'
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">Erro ao carregar mensagens</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg overflow-hidden border">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-semibold text-lg">
          {leadName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium">{leadName}</p>
          <p className="text-sm text-green-100">{formatPhone(leadPhone)}</p>
        </div>
        <MessageSquare className="h-5 w-5" />
      </div>

      {/* Warning if no WhatsApp connected */}
      {!hasConnectedInstance && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Nenhuma instancia WhatsApp conectada</span>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Composer */}
      <MessageComposer leadId={leadId} onMessageSent={() => refetch()} />
    </div>
  )
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4)
    const firstPart = cleaned.slice(4, 9)
    const secondPart = cleaned.slice(9)
    return `+55 (${ddd}) ${firstPart}-${secondPart}`
  }
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2)
    const firstPart = cleaned.slice(2, 7)
    const secondPart = cleaned.slice(7)
    return `(${ddd}) ${firstPart}-${secondPart}`
  }
  return phone
}
