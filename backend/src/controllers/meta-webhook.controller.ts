import { Request, Response } from 'express'
import { config } from '../config/index.js'
import { webhookService, MessageData } from '../services/webhook.service.js'

export async function handleMetaWebhookVerification(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'] as string
  const token = req.query['hub.verify_token'] as string
  const challenge = req.query['hub.challenge'] as string

  if (mode === 'subscribe' && token === config.meta.verifyToken) {
    console.log('[Meta Webhook] Verification successful')
    res.status(200).send(challenge)
  } else {
    console.error('[Meta Webhook] Verification failed - token mismatch')
    res.status(403).send('Forbidden')
  }
}

export async function handleMetaWebhook(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body

    if (body.object !== 'whatsapp_business_account') {
      res.status(404).send('Not Found')
      return
    }

    // Respond immediately to avoid Meta retries
    res.status(200).send('EVENT_RECEIVED')

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue

        const value = change.value
        const phoneNumberId = value.metadata?.phone_number_id

        if (!phoneNumberId) continue

        // Process incoming messages
        if (value.messages) {
          for (const msg of value.messages) {
            await processMetaMessage(phoneNumberId, msg, value.contacts)
          }
        }

        // Process status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await processMetaStatus(status)
          }
        }
      }
    }
  } catch (error) {
    console.error('[Meta Webhook] Error processing webhook:', error)
  }
}

async function processMetaMessage(
  phoneNumberId: string,
  msg: Record<string, unknown>,
  contacts: Array<{ profile: { name: string }; wa_id: string }> | undefined
): Promise<void> {
  const from = msg.from as string
  const msgId = msg.id as string
  const msgType = msg.type as string
  const timestamp = msg.timestamp as string

  const contactName = contacts?.find(c => c.wa_id === from)?.profile?.name || 'Sem nome'

  let content: string | null = null
  let contentType = 'text'

  switch (msgType) {
    case 'text': {
      const textBody = msg.text as { body: string }
      content = textBody?.body || null
      break
    }
    case 'image': {
      const image = msg.image as { caption?: string }
      content = image?.caption || null
      contentType = 'image'
      break
    }
    case 'video': {
      const video = msg.video as { caption?: string }
      content = video?.caption || null
      contentType = 'video'
      break
    }
    case 'document': {
      contentType = 'document'
      break
    }
    case 'audio': {
      contentType = 'audio'
      break
    }
    default: {
      console.log(`[Meta Webhook] Unsupported message type: ${msgType}`)
      return
    }
  }

  // Find instance by phone_number_id
  const instanceName = await getInstanceByPhoneNumberId(phoneNumberId)
  if (!instanceName) {
    console.error(`[Meta Webhook] No instance found for phone_number_id: ${phoneNumberId}`)
    return
  }

  const messageData: MessageData = {
    key: {
      remoteJid: `${from}@s.whatsapp.net`,
      fromMe: false,
      id: msgId,
    },
    pushName: contactName,
    message: content ? { conversation: content } : undefined,
    messageType: contentType,
    messageTimestamp: parseInt(timestamp, 10),
  }

  await webhookService.processIncomingMessage(instanceName, messageData)
}

async function processMetaStatus(status: Record<string, unknown>): Promise<void> {
  const msgId = status.id as string
  const statusValue = status.status as string

  if (!msgId || !statusValue) return

  const statusMap: Record<string, string> = {
    sent: 'SENT',
    delivered: 'DELIVERY_ACK',
    read: 'READ',
    failed: 'ERROR',
  }

  const mapped = statusMap[statusValue]
  if (mapped) {
    await webhookService.processMessageStatus('', { id: msgId, status: mapped })
  }
}

async function getInstanceByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  const { supabase } = await import('../config/supabase.js')

  const { data } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('meta_phone_number_id', phoneNumberId)
    .single()

  if (data) return data.instance_name

  // Fallback: if no meta_phone_number_id match, get the first active instance
  const { data: fallback } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('status', 'connected')
    .limit(1)
    .single()

  return fallback?.instance_name || null
}
