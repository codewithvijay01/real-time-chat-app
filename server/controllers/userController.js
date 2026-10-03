import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import User from '../models/User.js'
import { httpError, isObjectId, publicUser } from '../utils/asyncHandler.js'

const avatarDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads', 'avatars')

export async function listUsers(req, res) {
  const users = await User.find({ _id: { $ne: req.user._id } }).select('name username profilePicture status lastSeen bio').sort({ name: 1 }).limit(60)
  res.json({ success: true, data: { users } })
}

export async function searchUsers(req, res) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : ''
  if (query.length < 2) return res.json({ success: true, data: { users: [] } })
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ name: new RegExp(escaped, 'i') }, { username: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }],
  }).select('name username profilePicture status lastSeen bio').sort({ name: 1 }).limit(20)
  res.json({ success: true, data: { users } })
}

export async function getUser(req, res) {
  if (!isObjectId(req.params.id)) throw httpError(400, 'Invalid user identifier')
  const user = await User.findById(req.params.id).select('name username email profilePicture bio status lastSeen createdAt')
  if (!user) throw httpError(404, 'User not found')
  res.json({ success: true, data: { user } })
}

export async function updateProfile(req, res) {
  const updates = {}
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim()
    if (name.length < 2 || name.length > 80) throw httpError(400, 'Name must be between 2 and 80 characters')
    updates.name = name
  }
  if (req.body.bio !== undefined) {
    const bio = String(req.body.bio).trim()
    if (bio.length > 180) throw httpError(400, 'Bio must be 180 characters or fewer')
    updates.bio = bio
  }
  if (req.file) updates.profilePicture = `/uploads/avatars/${req.file.filename}`
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select('name username email profilePicture bio status lastSeen createdAt')
  res.json({ success: true, data: { user: publicUser(user) } })
}

export async function removeProfilePicture(req, res) {
  const user = await User.findById(req.user._id).select('name username email profilePicture bio status lastSeen createdAt')
  if (!user) throw httpError(404, 'User not found')
  const picturePath = user.profilePicture
  if (picturePath?.startsWith('/uploads/avatars/')) {
    const filename = picturePath.slice('/uploads/avatars/'.length)
    const filePath = path.resolve(avatarDirectory, filename)
    if (filename && path.basename(filename) === filename && filePath.startsWith(`${avatarDirectory}${path.sep}`)) {
      try { await unlink(filePath) } catch (error) { if (error.code !== 'ENOENT') throw error }
    }
  }
  user.profilePicture = ''
  await user.save()
  res.json({ success: true, data: { user: publicUser(user) } })
}