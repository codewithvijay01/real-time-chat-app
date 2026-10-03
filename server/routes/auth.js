import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { avatarUpload } from '../middleware/avatarUpload.js'
import { login, logout, me, register } from '../controllers/authController.js'

const router = Router()
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many attempts. Try again in a few minutes.' } })

router.post('/register', authLimiter, avatarUpload.single('profilePicture'), asyncHandler(register))
router.post('/login', authLimiter, asyncHandler(login))
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)

export default router