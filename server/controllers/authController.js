import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { httpError, publicUser } from '../utils/asyncHandler.js'

function issueToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export async function register(req, res) {
  const { name, username, email, password, confirmPassword } = req.body
  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (cleanName.length < 2 || cleanName.length > 80) throw httpError(400, 'Name must be between 2 and 80 characters')
  if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) throw httpError(400, 'Username must be 3 to 24 characters using letters, numbers, or underscores')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) throw httpError(400, 'Enter a valid email address')
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) throw httpError(400, 'Password must be between 8 and 72 characters')
  if (password !== confirmPassword) throw httpError(400, 'Passwords do not match')
  const existing = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] }).select('_id email username')
  if (existing) throw httpError(409, existing.email === cleanEmail ? 'An account with that email already exists' : 'That username is already taken')
  const passwordHash = await bcrypt.hash(password, 12)
  const profilePicture = req.file ? `/uploads/avatars/${req.file.filename}` : ''
  const user = await User.create({ name: cleanName, username: cleanUsername, email: cleanEmail, password: passwordHash, profilePicture })
  res.status(201).json({ success: true, data: { user: publicUser(user), token: issueToken(user._id) } })
}

export async function login(req, res) {
  const identity = typeof req.body.identity === 'string' ? req.body.identity.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (!identity || !password) throw httpError(400, 'Enter your email or username and password')
  const user = await User.findOne({ $or: [{ email: identity }, { username: identity }] }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) throw httpError(401, 'Email, username, or password is incorrect')
  res.json({ success: true, data: { user: publicUser(user), token: issueToken(user._id) } })
}

export function logout(req, res) {
  res.json({ success: true, data: { message: 'Signed out' } })
}

export function me(req, res) {
  res.json({ success: true, data: { user: publicUser(req.user) } })
}