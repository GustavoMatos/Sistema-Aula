import { z } from 'zod'

// Phone number validation (international format without +)
const phoneSchema = z.string().regex(/^\d{10,15}$/, 'Número de telefone inválido')

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    phone: phoneSchema,
    email: z.string().email('Email inválido').optional().nullable(),
    company: z.string().max(100).optional().nullable(),
    source: z.string().max(50).optional().nullable(),
    potential_value: z.number().min(0).optional().nullable(),
    tags: z.array(z.string().max(30)).max(10).optional().default([]),
    notes: z.string().max(5000).optional().nullable(),
    stage_id: z.string().uuid('ID do estágio inválido').optional(),
  }),
})

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    email: z.string().email('Email inválido').optional().nullable(),
    company: z.string().max(100).optional().nullable(),
    source: z.string().max(50).optional().nullable(),
    potential_value: z.number().min(0).optional().nullable(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    notes: z.string().max(5000).optional().nullable(),
  }),
})

export const leadIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})

export const updateStageSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    stage_id: z.string().uuid('ID do estágio inválido'),
  }),
})

export const listLeadsSchema = z.object({
  query: z.object({
    stage_id: z.string().uuid().optional(),
    tags: z.string().optional(), // comma-separated
    source: z.string().optional(),
    search: z.string().optional(),
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
    sort: z.enum(['created_at', 'updated_at', 'last_contact_at', 'name', 'potential_value']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  }),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body']
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>['body']
export type ListLeadsQuery = z.infer<typeof listLeadsSchema>['query']
