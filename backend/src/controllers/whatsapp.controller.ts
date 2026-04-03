import { Request, Response, NextFunction } from 'express'
import { evolutionService } from '../services/evolution/index.js'
import { whatsappInstanceService } from '../services/whatsapp-instance.service.js'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'
import { BadRequestError } from '../utils/errors.js'

// Helper to get string param (Express params can be string | string[])
const getParam = (params: Record<string, string>, key: string): string => params[key]

/**
 * Create a new WhatsApp instance
 * POST /api/whatsapp/instances
 */
export async function createInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const { name } = req.body

    logger.info(`Creating WhatsApp instance: ${name} for workspace: ${workspaceId}`)

    // Check if name is available
    const isAvailable = await whatsappInstanceService.isNameAvailable(name, workspaceId)
    if (!isAvailable) {
      throw new BadRequestError('Uma instância com esse nome já existe')
    }

    // Create instance in Evolution API
    const evolutionResponse = await evolutionService.createInstance(name)

    // Save to database
    const instance = await whatsappInstanceService.create({
      workspace_id: workspaceId,
      instance_name: name,
      api_key: evolutionResponse.hash?.apikey || evolutionResponse.instance?.apikey,
    })

    // Configure webhook (only if webhook URL is configured)
    if (config.webhookBaseUrl) {
      try {
        await evolutionService.setWebhook(name, {
          url: `${config.webhookBaseUrl}/api/webhooks/evolution`,
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        }, instance.api_key || undefined)
      } catch (webhookError) {
        logger.warn('Failed to configure webhook, continuing anyway', { error: webhookError })
      }
    }

    res.status(201).json(instance)
  } catch (error) {
    next(error)
  }
}

/**
 * List all instances for the workspace
 * GET /api/whatsapp/instances
 */
export async function listInstances(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id

    const instances = await whatsappInstanceService.findByWorkspace(workspaceId)

    res.json({ instances })
  } catch (error) {
    next(error)
  }
}

/**
 * Get instance details
 * GET /api/whatsapp/instances/:id
 */
export async function getInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const instance = await whatsappInstanceService.findById(id, workspaceId)

    res.json(instance)
  } catch (error) {
    next(error)
  }
}

/**
 * Get QR Code for instance connection
 * GET /api/whatsapp/instances/:id/qr
 */
export async function getQRCode(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const instance = await whatsappInstanceService.findById(id, workspaceId)

    // Get QR from Evolution API
    const qrResponse = await evolutionService.getQRCode(
      instance.instance_name,
      instance.api_key || undefined
    )

    res.json({
      pairingCode: qrResponse.pairingCode,
      qrCode: qrResponse.base64 || qrResponse.code,
      count: qrResponse.count,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get connection status
 * GET /api/whatsapp/instances/:id/status
 */
export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const instance = await whatsappInstanceService.findById(id, workspaceId)

    // Get status from Evolution API
    const statusResponse = await evolutionService.getConnectionStatus(
      instance.instance_name,
      instance.api_key || undefined
    )

    // Map Evolution status to our status
    const statusMap: Record<string, 'connected' | 'disconnected' | 'connecting'> = {
      open: 'connected',
      close: 'disconnected',
      connecting: 'connecting',
    }

    const status = statusMap[statusResponse.state] || 'disconnected'

    // Update status in database if changed
    if (instance.status !== status) {
      await whatsappInstanceService.updateStatus(id, status)
    }

    res.json({ status })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout from instance (disconnect WhatsApp)
 * POST /api/whatsapp/instances/:id/logout
 */
export async function logoutInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const instance = await whatsappInstanceService.findById(id, workspaceId)

    // Logout from Evolution API
    await evolutionService.logout(instance.instance_name, instance.api_key || undefined)

    // Update status in database
    await whatsappInstanceService.updateStatus(id, 'disconnected')

    res.json({ message: 'Instância desconectada com sucesso' })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete instance
 * DELETE /api/whatsapp/instances/:id
 */
export async function deleteInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const instance = await whatsappInstanceService.findById(id, workspaceId)

    // Delete from Evolution API
    try {
      await evolutionService.deleteInstance(instance.instance_name, instance.api_key || undefined)
    } catch (evolutionError) {
      logger.warn('Failed to delete from Evolution API, continuing with DB delete', {
        error: evolutionError,
      })
    }

    // Delete from database
    await whatsappInstanceService.delete(id)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
