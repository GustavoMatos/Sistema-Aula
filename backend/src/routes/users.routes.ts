import { Router } from 'express'
import {
  listUsers,
  getMe,
  updateMe,
  updateUser,
  deleteUser
} from '../controllers/users.controller.js'
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Current user profile
router.get('/me', getMe)
router.put('/me', updateMe)

// Admin routes
router.get('/', requireAdmin, listUsers)
router.put('/:id', requireAdmin, updateUser)
router.delete('/:id', requireAdmin, deleteUser)

export default router
