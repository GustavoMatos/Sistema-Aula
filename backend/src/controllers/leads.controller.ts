import { Request, Response, NextFunction } from 'express'
import { leadsService } from '../services/leads.service.js'
import { importService } from '../services/import.service.js'
import { logger } from '../utils/logger.js'
import { BadRequestError } from '../utils/errors.js'

// Helper to get string param
const getParam = (params: Record<string, string>, key: string): string => params[key]

/**
 * Create a new lead
 * POST /api/leads
 */
export async function createLead(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const userId = req.user!.id

    logger.info(`Creating lead for workspace: ${workspaceId}`)

    const lead = await leadsService.create(workspaceId, req.body, userId)

    res.status(201).json(lead)
  } catch (error) {
    next(error)
  }
}

/**
 * List leads with filters
 * GET /api/leads
 */
export async function listLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id

    const result = await leadsService.list({
      workspaceId,
      stage_id: req.query.stage_id as string | undefined,
      tags: req.query.tags as string | undefined,
      source: req.query.source as string | undefined,
      search: req.query.search as string | undefined,
      from_date: req.query.from_date as string | undefined,
      to_date: req.query.to_date as string | undefined,
      sort: (req.query.sort as 'created_at' | 'updated_at' | 'last_contact_at' | 'name' | 'potential_value') || 'created_at',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Get a single lead
 * GET /api/leads/:id
 */
export async function getLead(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const lead = await leadsService.getById(id, workspaceId)

    res.json(lead)
  } catch (error) {
    next(error)
  }
}

/**
 * Update a lead
 * PUT /api/leads/:id
 */
export async function updateLead(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const userId = req.user!.id
    const id = getParam(req.params as Record<string, string>, 'id')

    const lead = await leadsService.update(id, workspaceId, req.body, userId)

    res.json(lead)
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a lead (soft delete)
 * DELETE /api/leads/:id
 */
export async function deleteLead(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    await leadsService.delete(id, workspaceId)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

/**
 * Update lead stage
 * PATCH /api/leads/:id/stage
 */
export async function updateLeadStage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const userId = req.user!.id
    const id = getParam(req.params as Record<string, string>, 'id')
    const { stage_id } = req.body

    const lead = await leadsService.updateStage(id, workspaceId, stage_id, userId)

    res.json(lead)
  } catch (error) {
    next(error)
  }
}

/**
 * Get lead history
 * GET /api/leads/:id/history
 */
export async function getLeadHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const id = getParam(req.params as Record<string, string>, 'id')

    const history = await leadsService.getHistory(id, workspaceId)

    res.json({ history })
  } catch (error) {
    next(error)
  }
}

/**
 * Import leads from CSV
 * POST /api/leads/import
 */
export async function importLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const userId = req.user!.id

    if (!req.file) {
      throw new BadRequestError('Arquivo CSV é obrigatório')
    }

    logger.info(`Importing leads from CSV for workspace: ${workspaceId}`)

    const result = await importService.importCSV(workspaceId, userId, req.file)

    res.json(result)
  } catch (error) {
    next(error)
  }
}
