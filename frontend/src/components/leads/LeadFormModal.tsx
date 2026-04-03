import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useKanbanStages } from '@/hooks/useKanbanStages'
import { useCreateLead, useUpdateLead } from '@/hooks/useLeads'
import type { Lead } from '@/lib/api'

interface LeadFormData {
  name: string
  phone: string
  email: string
  company: string
  source: string
  potential_value: string
  stage_id: string
  notes: string
}

interface LeadFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
}

const LEAD_SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'indicacao', label: 'Indicacao' },
  { value: 'outro', label: 'Outro' },
]

export function LeadFormModal({
  open,
  onOpenChange,
  lead,
}: LeadFormModalProps) {
  const { data: stages } = useKanbanStages()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const isEditing = !!lead

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      company: '',
      source: '',
      potential_value: '',
      stage_id: '',
      notes: '',
    },
  })

  const sourceValue = watch('source')
  const stageValue = watch('stage_id')

  useEffect(() => {
    if (lead) {
      reset({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        company: lead.company || '',
        source: lead.source || '',
        potential_value: lead.potential_value?.toString() || '',
        stage_id: lead.stage_id || '',
        notes: lead.notes || '',
      })
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        company: '',
        source: '',
        potential_value: '',
        stage_id: stages?.[0]?.id || '',
        notes: '',
      })
    }
  }, [lead, stages, reset])

  const onSubmit = async (data: LeadFormData) => {
    const payload = {
      name: data.name,
      phone: data.phone.replace(/\D/g, ''),
      email: data.email || null,
      company: data.company || null,
      source: data.source || null,
      potential_value: data.potential_value ? parseFloat(data.potential_value) : null,
      stage_id: data.stage_id || undefined,
      notes: data.notes || null,
    }

    if (isEditing && lead) {
      await updateLead.mutateAsync({ id: lead.id, data: payload })
    } else {
      await createLead.mutateAsync(payload)
    }

    onOpenChange(false)
  }

  const isPending = createLead.isPending || updateLead.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Lead' : 'Novo Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome do lead"
                {...register('name', { required: 'Nome e obrigatorio', minLength: { value: 2, message: 'Minimo 2 caracteres' } })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...register('phone', { required: 'Telefone e obrigatorio', minLength: { value: 10, message: 'Telefone invalido' } })}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Nome da empresa"
                {...register('company')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={sourceValue}
                onValueChange={(value) => setValue('source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estagio</Label>
              <Select
                value={stageValue}
                onValueChange={(value) => setValue('stage_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estagio" />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="potential_value">Valor Potencial (R$)</Label>
            <Input
              id="potential_value"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              {...register('potential_value')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observacoes sobre o lead..."
              rows={3}
              {...register('notes')}
            />
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
                  : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
