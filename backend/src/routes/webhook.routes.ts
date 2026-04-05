import { Router } from 'express'
import { webhookController } from '../controllers/webhook.controller.js'

const router = Router()

// Health check endpoint
router.get('/health', webhookController.healthCheck)

// Main Evolution API webhook endpoint
// This endpoint receives all webhook events from Evolution API
router.post('/evolution', webhookController.handleEvolutionWebhook)

// Alternative endpoint for specific instance webhooks
// Evolution API can be configured to send webhooks to /webhook/evolution/:instanceName
router.post('/evolution/:instanceName', webhookController.handleEvolutionWebhook)

export default router
