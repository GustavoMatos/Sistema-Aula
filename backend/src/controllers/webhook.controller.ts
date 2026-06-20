import { Request, Response } from 'express'
import { webhookService, EvolutionWebhookEvent, MessageData } from '../services/webhook.service.js'

function normalizeEvent(raw: string): string {
  return raw.toLowerCase().replace(/_/g, '.')
}

export async function handleEvolutionWebhook(req: Request, res: Response): Promise<void> {
  try {
    const event = req.body as EvolutionWebhookEvent
    const normalized = normalizeEvent(event.event || '')

    console.log(`[Webhook] Received event: ${event.event} (${normalized}) from instance: ${event.instance}`)

    switch (normalized) {
      case 'messages.upsert':
        await handleMessagesUpsert(event)
        break

      case 'messages.update':
        await webhookService.processMessageStatus(event.instance, event.data)
        break

      case 'connection.update':
        if (event.data.state) {
          await webhookService.processConnectionStatus(event.instance, event.data.state as string)
        }
        break

      case 'qrcode.updated':
        console.log(`[Webhook] QR code updated for instance: ${event.instance}`)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${event.event}`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleMessagesUpsert(event: EvolutionWebhookEvent): Promise<void> {
  const data = event.data as unknown as MessageData

  if (!data || !data.key) {
    console.log('[Webhook] No message data in upsert event')
    return
  }

  if (data.key.remoteJid.includes('@g.us')) {
    console.log('[Webhook] Skipping group message')
    return
  }

  if (data.key.remoteJid === 'status@broadcast') {
    console.log('[Webhook] Skipping status broadcast')
    return
  }

  await webhookService.processIncomingMessage(event.instance, data)
}

export async function webhookHealthCheck(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'ok',
    service: 'webhook',
    timestamp: new Date().toISOString(),
  })
}
