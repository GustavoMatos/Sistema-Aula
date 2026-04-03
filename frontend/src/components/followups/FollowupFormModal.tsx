import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateFollowup, useUpdateFollowup } from '@/hooks/useFollowups'
import type { Followup } from '@/lib/api'

interface FollowupFormData {
  title: string
  description: string
  due_date: string
  due_time: string
  priority: 'low' | 'medium' | 'high'
  type: 'call' | 'message' | 'meeting' | 'email' | 'other'
}

interface FollowupFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  followup?: Followup | null
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa', color: 'text-gray-500' },
  { value: 'medium', label: 'Media', color: 'text-yellow-500' },
  { value: 'high', label: 'Alta', color: 'text-red-500' },
]

const TYPE_OPTIONS = [
  { value: 'call', label: 'Ligacao' },
  { value: 'message', label: 'Mensagem' },
  { value: 'meeting', label: 'Reuniao' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Outro' },
]

export function FollowupFormModal({
  open,
  onOpenChange,
  leadId,
  followup,
}: FollowupFormModalProps) {
  const createFollowup = useCreateFollowup()
  const updateFollowup = useUpdateFollowup()

  const isEditing = !!followup

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FollowupFormData>({
    defaultValues: {
      title: '',
      description: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      due_time: '09:00',
      priority: 'medium',
      type: 'other',
    },
  })

  const priorityValue = watch('priority')
  const typeValue = watch('type')

  useEffect(() => {
    if (followup) {
      const dueDate = new Date(followup.due_date)
      reset({
        title: followup.title,
        description: followup.description || '',
        due_date: format(dueDate, 'yyyy-MM-dd'),
        due_time: format(dueDate, 'HH:mm'),
        priority: followup.priority,
        type: followup.type,
      })
    } else {
      reset({
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        due_time: '09:00',
        priority: 'medium',
        type: 'other',
      })
    }
  }, [followup, reset])

  const onSubmit = async (data: FollowupFormData) => {
    const dueDate = new Date(`${data.due_date}T${data.due_time}:00`)

    if (isEditing && followup) {
      await updateFollowup.mutateAsync({
        id: followup.id,
        data: {
          title: data.title,
          description: data.description || undefined,
          due_date: dueDate.toISOString(),
          priority: data.priority,
          type: data.type,
        },
      })
    } else {
      await createFollowup.mutateAsync({
        lead_id: leadId,
        title: data.title,
        description: data.description || undefined,
        due_date: dueDate.toISOString(),
        priority: data.priority,
        type: data.type,
      })
    }

    onOpenChange(false)
  }

  const isPending = createFollowup.isPending || updateFollowup.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Follow-up' : 'Novo Follow-up'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              placeholder="Ex: Ligar para confirmar interesse"
              {...register('title', { required: 'Titulo e obrigatorio' })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              placeholder="Detalhes do follow-up..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Data *</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date', { required: 'Data e obrigatoria' })}
              />
              {errors.due_date && (
                <p className="text-sm text-red-500">{errors.due_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time">Hora *</Label>
              <Input
                id="due_time"
                type="time"
                {...register('due_time', { required: 'Hora e obrigatoria' })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={priorityValue}
                onValueChange={(value) =>
                  setValue('priority', value as 'low' | 'medium' | 'high')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={typeValue}
                onValueChange={(value) =>
                  setValue(
                    'type',
                    value as 'call' | 'message' | 'meeting' | 'email' | 'other'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar'
                  : 'Criar Follow-up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
