import { Request, Response } from 'express'
import { webhookService, EvolutionWebhookEvent, MessageData } from '../services/webhook.service.js'

class WebhookController {
  // Main webhook handler for Evolution API v2
  async handleEvolutionWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body as EvolutionWebhookEvent

      console.log(`[Webhook] Received event: ${event.event} from instance: ${event.instance}`)

      // Process based on event type
      switch (event.event) {
        case 'messages.upsert':
          await this.handleMessagesUpsert(event)
          break

        case 'messages.update':
          await this.handleMessagesUpdate(event)
          break

        case 'connection.update':
          await this.handleConnectionUpdate(event)
          break

        case 'qrcode.updated':
          // QR code updates are handled by the frontend polling
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

  private async handleMessagesUpsert(event: EvolutionWebhookEvent): Promise<void> {
    const data = event.data as unknown as MessageData

    // Skip if no message data
    if (!data || !data.key) {
      console.log('[Webhook] No message data in upsert event')
      return
    }

    // Skip group messages (only handle private chats)
    if (data.key.remoteJid.includes('@g.us')) {
      console.log('[Webhook] Skipping group message')
      return
    }

    // Skip status broadcasts
    if (data.key.remoteJid === 'status@broadcast') {
      console.log('[Webhook] Skipping status broadcast')
      return
    }

    await webhookService.processIncomingMessage(event.instance, data)
  }

  private async handleMessagesUpdate(event: EvolutionWebhookEvent): Promise<void> {
    await webhookService.processMessageStatus(event.instance, event.data)
  }

  private async handleConnectionUpdate(event: EvolutionWebhookEvent): Promise<void> {
    const status = event.data.state as string
    if (status) {
      await webhookService.processConnectionStatus(event.instance, status)
    }
  }

  // Health check endpoint for webhook
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      service: 'webhook',
      timestamp: new Date().toISOString(),
    })
  }
}

export const webhookController = new WebhookController()
