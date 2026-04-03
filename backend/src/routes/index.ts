import { Router } from 'express'
import healthRoutes from './health.routes.js'
import whatsappRoutes from './whatsapp.routes.js'
import messagesRoutes from './messages.routes.js'
import leadsRoutes from './leads.routes.js'
import kanbanRoutes from './kanban.routes.js'
import followupsRoutes from './followups.routes.js'
import webhookRoutes from './webhook.routes.js'
import dashboardRoutes from './dashboard.routes.js'

const router = Router()

// Health check (no auth required)
router.use('/health', healthRoutes)

// Webhooks (no auth - receives from Evolution API)
router.use('/webhooks', webhookRoutes)

// Dashboard (auth handled in routes file)
router.use('/dashboard', dashboardRoutes)

// WhatsApp instances (auth handled in routes file)
router.use('/whatsapp', whatsappRoutes)

// Messages (auth handled in routes file)
router.use('/messages', messagesRoutes)

// Leads (auth handled in routes file)
router.use('/leads', leadsRoutes)

// Kanban board (auth handled in routes file)
router.use('/kanban', kanbanRoutes)

// Follow-ups (auth handled in routes file)
router.use('/followups', followupsRoutes)

export default router
