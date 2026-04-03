import { z } from 'zod'

export const createStageSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
  position: z.number().int().min(0).optional(),
  is_final: z.boolean().optional().default(false),
})

export const updateStageSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  position: z.number().int().min(0).optional(),
  is_final: z.boolean().optional(),
})

export const reorderStagesSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ),
})

export type CreateStageDTO = z.infer<typeof createStageSchema>
export type UpdateStageDTO = z.infer<typeof updateStageSchema>
export type ReorderStagesDTO = z.infer<typeof reorderStagesSchema>
