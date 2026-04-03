import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { sendMessageSchema, getMessagesSchema } from '../validators/messages.validator.js'
import {
  sendMessage,
  getLeadMessages,
  getMessage,
} from '../controllers/messages.controller.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Send a message
router.post('/send', validate(sendMessageSchema), sendMessage)

// Get messages for a lead
router.get('/lead/:leadId', validate(getMessagesSchema), getLeadMessages)

// Get a single message
router.get('/:id', getMessage)

export default router
