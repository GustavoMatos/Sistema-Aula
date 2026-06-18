import { Router } from 'express'
import {
  listTenants,
  getTenant,
  createTenant,
  createTenantWithAdmin,
  updateTenant,
  deleteTenant,
  getSuperadminDashboard
} from '../controllers/tenants.controller.js'
import { authMiddleware, requireSuperadmin } from '../middlewares/auth.middleware.js'

const router = Router()

// All routes require authentication and superadmin role
router.use(authMiddleware)
router.use(requireSuperadmin)

// Superadmin dashboard
router.get('/dashboard', getSuperadminDashboard)

// Tenant CRUD
router.get('/', listTenants)
router.get('/:id', getTenant)
router.post('/', createTenant)
router.post('/with-admin', createTenantWithAdmin)
router.put('/:id', updateTenant)
router.delete('/:id', deleteTenant)

export default router
