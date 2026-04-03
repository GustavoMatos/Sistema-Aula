import { z } from 'zod'

// Create instance validation
export const createInstanceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(50, 'Nome deve ter no máximo 50 caracteres')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Nome deve conter apenas letras, números, underscores e hífens'
      ),
  }),
})

// Get instance by ID validation
export const instanceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})

// Types
export type CreateInstanceInput = z.infer<typeof createInstanceSchema>['body']
