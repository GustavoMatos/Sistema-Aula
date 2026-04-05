import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import {
  listFollowups,
  getFollowup,
  createFollowup,
  updateFollowup,
  deleteFollowup,
  completeFollowup,
  getTodayFollowups,
  getOverdueFollowups,
  getFollowupsCounts,
} from '../controllers/followups.controller.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Special routes (must come before :id routes)
router.get('/today', getTodayFollowups)
router.get('/overdue', getOverdueFollowups)
router.get('/counts', getFollowupsCounts)

// CRUD routes
router.get('/', listFollowups)
router.get('/:id', getFollowup)
router.post('/', createFollowup)
router.put('/:id', updateFollowup)
router.delete('/:id', deleteFollowup)

// Action routes
router.post('/:id/complete', completeFollowup)

export default router
