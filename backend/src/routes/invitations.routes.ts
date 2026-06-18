import { Router } from 'express'
import {
  createInvitation,
  listInvitations,
  cancelInvitation,
  validateInvitation,
  acceptInvitation,
  resendInvitation
} from '../controllers/invitations.controller.js'
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware.js'

const router = Router()

// Public routes (no auth required)
router.get('/validate/:token', validateInvitation)
router.post('/accept/:token', acceptInvitation)

// Protected routes (requires authentication)
router.use(authMiddleware)

// Requires admin role (admin_tenant or superadmin)
router.post('/', requireAdmin, createInvitation)
router.get('/', requireAdmin, listInvitations)
router.post('/:id/resend', requireAdmin, resendInvitation)
router.delete('/:id', requireAdmin, cancelInvitation)

export default router
