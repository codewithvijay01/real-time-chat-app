import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createConversation, getConversation, listConversations } from '../controllers/conversationController.js'

const router = Router()
router.use(authenticate)
router.get('/', asyncHandler(listConversations))
router.post('/', asyncHandler(createConversation))
router.get('/:id', asyncHandler(getConversation))

export default router