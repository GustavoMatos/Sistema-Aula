import { z } from 'zod'

export const sendMessageSchema = z.object({
  body: z.object({
    lead_id: z.string().uuid('ID do lead inválido'),
    type: z.enum(['text', 'image', 'document', 'audio', 'video'], {
      errorMap: () => ({ message: 'Tipo de mensagem inválido' }),
    }),
    content: z.string().min(1).max(4096).optional().nullable(),
    media_url: z.string().url('URL de mídia inválida').optional().nullable(),
    caption: z.string().max(1024).optional().nullable(),
  }).refine(
    (data) => {
      // Text messages require content
      if (data.type === 'text') {
        return !!data.content
      }
      // Media messages require media_url
      return !!data.media_url
    },
    {
      message: 'Mensagens de texto requerem content, mensagens de mídia requerem media_url',
    }
  ),
})

export const getMessagesSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).default('50').optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).default('0').optional(),
  }),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>['body']
export type GetMessagesInput = z.infer<typeof getMessagesSchema>
