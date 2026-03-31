import { Router } from 'express'
import healthRoutes from './health.routes.js'

const router = Router()

// Health check
router.use('/health', healthRoutes)

// API routes will be added here
// router.use('/leads', authMiddleware, leadRoutes)
// router.use('/kanban', authMiddleware, kanbanRoutes)
// router.use('/whatsapp', authMiddleware, whatsappRoutes)
// router.use('/followups', authMiddleware, followupRoutes)
// router.use('/analytics', authMiddleware, analyticsRoutes)
// router.use('/webhooks', webhookRoutes)

export default router
