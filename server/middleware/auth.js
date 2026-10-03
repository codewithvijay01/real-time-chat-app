import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('_id name username email profilePicture bio status lastSeen')
    if (!user) return res.status(401).json({ success: false, message: 'Session is no longer valid' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}