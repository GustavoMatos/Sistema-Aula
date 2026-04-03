import type { Request, Response, NextFunction } from 'express'
import { followupsService } from '../services/followups.service'
import {
  createFollowupSchema,
  updateFollowupSchema,
  listFollowupsSchema,
} from '../validators/followups.validator'

// List followups
export async function listFollowups(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const validation = listFollowupsSchema.safeParse(req.query)

    if (!validation.success) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        details: validation.error.flatten().fieldErrors,
      })
      return
    }

    const result = await followupsService.list(workspaceId, validation.data)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

// Get followup by ID
export async function getFollowup(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id

    const followup = await followupsService.getById(id, workspaceId)

    if (!followup) {
      res.status(404).json({ error: 'Follow-up não encontrado' })
      return
    }

    res.json(followup)
  } catch (error) {
    next(error)
  }
}

// Create followup
export async function createFollowup(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const userId = req.user!.id
    const validation = createFollowupSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: validation.error.flatten().fieldErrors,
      })
      return
    }

    const followup = await followupsService.create(workspaceId, userId, validation.data)

    res.status(201).json(followup)
  } catch (error) {
    next(error)
  }
}

// Update followup
export async function updateFollowup(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id
    const validation = updateFollowupSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: validation.error.flatten().fieldErrors,
      })
      return
    }

    const followup = await followupsService.update(id, workspaceId, validation.data)

    res.json(followup)
  } catch (error) {
    next(error)
  }
}

// Delete followup
export async function deleteFollowup(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id

    await followupsService.delete(id, workspaceId)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// Complete followup
export async function completeFollowup(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id

    const followup = await followupsService.complete(id, workspaceId)

    res.json(followup)
  } catch (error) {
    next(error)
  }
}

// Get today's followups
export async function getTodayFollowups(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id

    const followups = await followupsService.getTodayFollowups(workspaceId)

    res.json({ followups })
  } catch (error) {
    next(error)
  }
}

// Get overdue followups
export async function getOverdueFollowups(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id

    const followups = await followupsService.getOverdueFollowups(workspaceId)

    res.json({ followups })
  } catch (error) {
    next(error)
  }
}

// Get followups counts
export async function getFollowupsCounts(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id

    const counts = await followupsService.getCountsByStatus(workspaceId)

    res.json(counts)
  } catch (error) {
    next(error)
  }
}
