import { Router } from 'express'
import {
  createInstance,
  listInstances,
  getInstance,
  getQRCode,
  getStatus,
  logoutInstance,
  deleteInstance,
} from '../controllers/whatsapp.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createInstanceSchema, instanceIdSchema } from '../validators/whatsapp.validator.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Instance management
router.post('/instances', validate(createInstanceSchema), createInstance)
router.get('/instances', listInstances)
router.get('/instances/:id', validate(instanceIdSchema), getInstance)
router.get('/instances/:id/qr', validate(instanceIdSchema), getQRCode)
router.get('/instances/:id/status', validate(instanceIdSchema), getStatus)
router.post('/instances/:id/logout', validate(instanceIdSchema), logoutInstance)
router.delete('/instances/:id', validate(instanceIdSchema), deleteInstance)

export default router
