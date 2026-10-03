import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { deleteMessage, listMessages, markRead, sendMessage } from '../controllers/messageController.js'

const router = Router()
router.use(authenticate)
router.get('/:conversationId', asyncHandler(listMessages))
router.post('/', sendMessage)
router.put('/:id/read', asyncHandler(markRead))
router.delete('/:id', asyncHandler(deleteMessage))

export default router