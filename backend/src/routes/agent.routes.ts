import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { chatWithAgent, agentHealth } from '../controllers/agent.controller.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Chat with AI agent
router.post('/chat', chatWithAgent)

// Agent health check
router.get('/health', agentHealth)

export default router
