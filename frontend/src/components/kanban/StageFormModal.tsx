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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateStage, useUpdateStage } from '@/hooks/useKanban'
import type { KanbanStage } from '@/lib/api'

interface StageFormData {
  name: string
  color: string
  is_final: boolean
}

interface StageFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage?: KanbanStage | null
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#64748b', // Slate
]

export function StageFormModal({
  open,
  onOpenChange,
  stage,
}: StageFormModalProps) {
  const createStage = useCreateStage()
  const updateStage = useUpdateStage()

  const isEditing = !!stage

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StageFormData>({
    defaultValues: {
      name: '',
      color: PRESET_COLORS[0],
      is_final: false,
    },
  })

  const selectedColor = watch('color')
  const isFinal = watch('is_final')

  useEffect(() => {
    if (stage) {
      reset({
        name: stage.name,
        color: stage.color,
        is_final: stage.is_final,
      })
    } else {
      reset({
        name: '',
        color: PRESET_COLORS[0],
        is_final: false,
      })
    }
  }, [stage, reset])

  const onSubmit = async (data: StageFormData) => {
    if (isEditing && stage) {
      await updateStage.mutateAsync({ id: stage.id, data })
    } else {
      await createStage.mutateAsync(data)
    }
    onOpenChange(false)
  }

  const isPending = createStage.isPending || updateStage.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Estagio' : 'Novo Estagio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Estagio *</Label>
            <Input
              id="name"
              placeholder="Ex: Novo Lead, Qualificado, Proposta..."
              {...register('name', { required: 'Nome e obrigatorio' })}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="color"
                className="w-12 h-8 p-0 border-0"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
              />
              <Input
                type="text"
                className="w-24"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_final"
              checked={isFinal}
              onCheckedChange={(checked) => setValue('is_final', !!checked)}
            />
            <Label htmlFor="is_final" className="font-normal">
              Estagio final (leads concluidos/fechados)
            </Label>
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
                  : 'Criar Estagio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
