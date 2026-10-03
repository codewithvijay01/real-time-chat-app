import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { avatarUpload } from '../middleware/avatarUpload.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getUser, listUsers, removeProfilePicture, searchUsers, updateProfile } from '../controllers/userController.js'

const router = Router()
router.use(authenticate)
router.get('/', asyncHandler(listUsers))
router.get('/search', asyncHandler(searchUsers))
router.delete('/profile/avatar', asyncHandler(removeProfilePicture))
router.get('/:id', asyncHandler(getUser))
router.put('/profile', avatarUpload.single('profilePicture'), asyncHandler(updateProfile))

export default router