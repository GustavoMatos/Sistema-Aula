import { Request, Response, NextFunction } from 'express'
import { messagesService } from '../services/messages.service.js'
import { logger } from '../utils/logger.js'

// Helper to get string param
const getParam = (params: Record<string, string>, key: string): string => params[key]

/**
 * Send a message to a lead
 * POST /api/messages/send
 */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const userId = req.user!.id
    const { lead_id, type, content, media_url, caption } = req.body

    logger.info(`Sending ${type} message to lead: ${lead_id}`)

    const message = await messagesService.send({
      workspace_id: workspaceId,
      user_id: userId,
      lead_id,
      type,
      content,
      media_url,
      caption,
    })

    res.status(201).json(message)
  } catch (error) {
    next(error)
  }
}

/**
 * Get messages for a lead
 * GET /api/messages/lead/:leadId
 */
export async function getLeadMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const leadId = getParam(req.params as Record<string, string>, 'leadId')
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const result = await messagesService.getByLead(leadId, workspaceId, limit, offset)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Get a single message
 * GET /api/messages/:id
 */
export async function getMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const message = await messagesService.getById(id, workspaceId)

    res.json(message)
  } catch (error) {
    next(error)
  }
}
