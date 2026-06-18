import { Request, Response, NextFunction } from 'express'
import { agentService } from '../services/agent.service.js'
import { logger } from '../utils/logger.js'

/**
 * Chat with AI agent
 * POST /api/agent/chat
 */
export async function chatWithAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id
    const tenantId = req.user!.tenant_id
    const { message, session_id } = req.body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Mensagem é obrigatória' })
      return
    }

    // Use provided session_id or generate one from user+tenant
    const sessionId = session_id || `${tenantId}-${userId}`

    logger.info('Agent chat request', { userId, tenantId, sessionId })

    const result = await agentService.chat(message.trim(), sessionId, tenantId, userId)

    res.json({
      response: result.message,
      session_id: sessionId,
      execution_id: result.executionId,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Check agent health
 * GET /api/agent/health
 */
export async function agentHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await agentService.healthCheck()
    res.json(health)
  } catch (error) {
    next(error)
  }
}
