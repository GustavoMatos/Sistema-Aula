import type { Request, Response, NextFunction } from 'express'
import { kanbanService } from '../services/kanban.service'
import {
  createStageSchema,
  updateStageSchema,
  reorderStagesSchema,
} from '../validators/kanban.validator'

// List all stages
export async function listStages(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const stages = await kanbanService.listStages(workspaceId)

    res.json({ stages })
  } catch (error) {
    next(error)
  }
}

// Get kanban board with leads
export async function getBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const columns = await kanbanService.getBoard(workspaceId)

    res.json({ columns })
  } catch (error) {
    next(error)
  }
}

// Create a new stage
export async function createStage(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const validation = createStageSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: validation.error.flatten().fieldErrors,
      })
      return
    }

    const stage = await kanbanService.createStage(workspaceId, validation.data)

    res.status(201).json(stage)
  } catch (error) {
    next(error)
  }
}

// Update a stage
export async function updateStage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id
    const validation = updateStageSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: validation.error.flatten().fieldErrors,
      })
      return
    }

    const stage = await kanbanService.updateStage(id, workspaceId, validation.data)

    res.json(stage)
  } catch (error) {
    next(error)
  }
}

// Delete a stage
export async function deleteStage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id

    await kanbanService.deleteStage(id, workspaceId)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// Reorder stages
export async function reorderStages(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.user!.workspace_id
    const validation = reorderStagesSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: validation.error.flatten().fieldErrors,
      })
      return
    }

    const stages = await kanbanService.reorderStages(workspaceId, validation.data)

    res.json({ stages })
  } catch (error) {
    next(error)
  }
}

// Get a single stage
export async function getStage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const workspaceId = req.user!.workspace_id

    const stage = await kanbanService.getStageById(id, workspaceId)

    if (!stage) {
      res.status(404).json({ error: 'Estágio não encontrado' })
      return
    }

    res.json(stage)
  } catch (error) {
    next(error)
  }
}
