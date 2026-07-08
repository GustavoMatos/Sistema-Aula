import { Router } from 'express'
import { handleEvolutionWebhook, webhookHealthCheck } from '../controllers/webhook.controller.js'
import { handleMetaWebhook, handleMetaWebhookVerification } from '../controllers/meta-webhook.controller.js'

const router = Router()

router.get('/health', webhookHealthCheck)

// Evolution API webhooks (legacy)
router.post('/evolution', handleEvolutionWebhook)
router.post('/evolution/:instanceName', handleEvolutionWebhook)

// Meta Cloud API webhooks
router.get('/meta', handleMetaWebhookVerification)
router.post('/meta', handleMetaWebhook)

export default router
