import { Router } from 'express'
import { handleEvolutionWebhook, webhookHealthCheck } from '../controllers/webhook.controller.js'

const router = Router()

router.get('/health', webhookHealthCheck)

router.post('/evolution', handleEvolutionWebhook)
router.post('/evolution/:instanceName', handleEvolutionWebhook)

export default router
