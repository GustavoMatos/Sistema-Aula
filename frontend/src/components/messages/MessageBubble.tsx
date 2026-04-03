import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, CheckCheck, Clock, AlertCircle, Image, File, Volume2, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/api'

interface MessageBubbleProps {
  message: Message
}

const STATUS_ICONS = {
  pending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
}

const CONTENT_TYPE_ICONS = {
  image: Image,
  document: File,
  audio: Volume2,
  video: Video,
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const StatusIcon = STATUS_ICONS[message.status]
  const ContentIcon = CONTENT_TYPE_ICONS[message.content_type as keyof typeof CONTENT_TYPE_ICONS]

  const formatTime = (date: string | null) => {
    if (!date) return ''
    return format(new Date(date), 'HH:mm', { locale: ptBR })
  }

  const renderContent = () => {
    switch (message.content_type) {
      case 'image':
        return (
          <div className="space-y-1">
            {message.media_url && (
              <img
                src={message.media_url}
                alt="Imagem"
                className="max-w-xs rounded-lg"
              />
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )

      case 'document':
        return (
          <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
            <File className="h-8 w-8" />
            <div>
              <p className="text-sm font-medium">Documento</p>
              {message.content && (
                <p className="text-xs opacity-80">{message.content}</p>
              )}
            </div>
          </div>
        )

      case 'audio':
        return (
          <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
            <Volume2 className="h-6 w-6" />
            <span className="text-sm">Audio</span>
          </div>
        )

      case 'video':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
              <Video className="h-6 w-6" />
              <span className="text-sm">Video</span>
            </div>
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )

      default:
        return (
          <p className="text-sm whitespace-pre-wrap">
            {message.content || (
              <span className="flex items-center gap-1 text-xs opacity-70">
                {ContentIcon && <ContentIcon className="h-4 w-4" />}
                Midia
              </span>
            )}
          </p>
        )
    }
  }

  return (
    <div
      className={cn(
        'flex',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-3 py-2',
          isOutbound
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        )}
      >
        {renderContent()}

        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOutbound ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isOutbound ? 'text-green-100' : 'text-gray-500'
            )}
          >
            {formatTime(message.sent_at || message.created_at)}
          </span>

          {isOutbound && StatusIcon && (
            <StatusIcon
              className={cn(
                'h-3 w-3',
                message.status === 'read'
                  ? 'text-blue-300'
                  : message.status === 'failed'
                    ? 'text-red-300'
                    : 'text-green-100'
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}
