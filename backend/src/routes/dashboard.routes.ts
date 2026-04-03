import { Router } from 'express'
import { dashboardController } from '../controllers/dashboard.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

// All dashboard routes require authentication
router.use(authMiddleware)

// Get dashboard stats
router.get('/stats', dashboardController.getStats)

// Get recent activity
router.get('/activity', dashboardController.getRecentActivity)

export default router
