import { cn } from '@/lib/utils'

type InstanceStatus = 'connected' | 'disconnected' | 'connecting'

interface StatusBadgeProps {
  status: InstanceStatus
  className?: string
}

const statusConfig: Record<InstanceStatus, { color: string; bgColor: string; label: string }> = {
  connected: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    label: 'Conectado',
  },
  disconnected: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Desconectado',
  },
  connecting: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    label: 'Conectando',
  },
}

const dotColors: Record<InstanceStatus, string> = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  connecting: 'bg-yellow-500 animate-pulse',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const dotColor = dotColors[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      {config.label}
    </span>
  )
}
