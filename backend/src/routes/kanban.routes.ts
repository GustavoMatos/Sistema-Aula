import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import {
  listStages,
  getBoard,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  getStage,
} from '../controllers/kanban.controller.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Board
router.get('/board', getBoard)

// Stages
router.get('/stages', listStages)
router.get('/stages/:id', getStage)
router.post('/stages', createStage)
router.put('/stages/:id', updateStage)
router.delete('/stages/:id', deleteStage)
router.post('/stages/reorder', reorderStages)

export default router
