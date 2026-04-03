import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { csvUpload } from '../middlewares/upload.middleware.js'
import {
  createLeadSchema,
  updateLeadSchema,
  leadIdSchema,
  updateStageSchema,
  listLeadsSchema,
} from '../validators/leads.validator.js'
import {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  updateLeadStage,
  getLeadHistory,
  importLeads,
} from '../controllers/leads.controller.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Import leads from CSV (must be before /:id routes)
router.post('/import', csvUpload.single('file'), importLeads)

// Create a lead
router.post('/', validate(createLeadSchema), createLead)

// List leads with filters
router.get('/', validate(listLeadsSchema), listLeads)

// Get a single lead
router.get('/:id', validate(leadIdSchema), getLead)

// Update a lead
router.put('/:id', validate(updateLeadSchema), updateLead)

// Delete a lead (soft delete)
router.delete('/:id', validate(leadIdSchema), deleteLead)

// Update lead stage (for Kanban)
router.patch('/:id/stage', validate(updateStageSchema), updateLeadStage)

// Get lead history
router.get('/:id/history', validate(leadIdSchema), getLeadHistory)

export default router
