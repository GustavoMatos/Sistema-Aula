import { useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/lib/api'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

function DateDivider({ date }: { date: Date }) {
  let dateLabel: string

  if (isToday(date)) {
    dateLabel = 'Hoje'
  } else if (isYesterday(date)) {
    dateLabel = 'Ontem'
  } else {
    dateLabel = format(date, "dd 'de' MMMM", { locale: ptBR })
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
        {dateLabel}
      </div>
    </div>
  )
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Nenhuma mensagem ainda. Envie a primeira!</p>
      </div>
    )
  }

  // Sort messages by time (oldest first)
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.sent_at || a.created_at).getTime()
    const dateB = new Date(b.sent_at || b.created_at).getTime()
    return dateA - dateB
  })

  // Group messages by date
  const groupedMessages = sortedMessages.reduce(
    (groups, message) => {
      const date = new Date(message.sent_at || message.created_at)
      const dateKey = format(date, 'yyyy-MM-dd')

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
      return groups
    },
    {} as Record<string, Message[]>
  )

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedMessages).sort()

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <DateDivider date={new Date(dateKey)} />
          <div className="space-y-2">
            {groupedMessages[dateKey].map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
