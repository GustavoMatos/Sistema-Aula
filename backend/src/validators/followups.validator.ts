import { z } from 'zod'

export const createFollowupSchema = z.object({
  lead_id: z.string().uuid('ID do lead inválido'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  due_date: z.string().datetime('Data inválida'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  type: z.enum(['call', 'message', 'meeting', 'email', 'other']).default('other'),
})

export const updateFollowupSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  type: z.enum(['call', 'message', 'meeting', 'email', 'other']).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  completed_at: z.string().datetime().nullable().optional(),
})

export const listFollowupsSchema = z.object({
  lead_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'all']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  type: z.enum(['call', 'message', 'meeting', 'email', 'other']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  overdue: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateFollowupDTO = z.infer<typeof createFollowupSchema>
export type UpdateFollowupDTO = z.infer<typeof updateFollowupSchema>
export type ListFollowupsQuery = z.infer<typeof listFollowupsSchema>
