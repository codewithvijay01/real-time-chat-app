import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import { createMessage } from '../utils/messageService.js'
import { isObjectId } from '../utils/asyncHandler.js'

export function initializeSockets(io) {
  const onlineUsers = { sockets: new Map(), activeConversations: new Map() }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication required'))
      socket.userId = jwt.verify(token, process.env.JWT_SECRET).sub
      next()
    } catch {
      next(new Error('Invalid or expired token'))
    }
  })
  io.engine.on('connection_error', (error) => console.warn('Socket connection rejected:', error.message))

  io.on('connection', async (socket) => {
    const userId = socket.userId
    const userKey = userId.toString()
    const sockets = onlineUsers.sockets.get(userKey) || new Set()
    const wasOffline = sockets.size === 0
    sockets.add(socket.id)
    onlineUsers.sockets.set(userKey, sockets)
    socket.join(`user:${userKey}`)
    if (wasOffline) {
      await User.findByIdAndUpdate(userId, { status: 'online' })
      io.emit('user:online', { userId })
    }
    socket.emit('presence:snapshot', { onlineUserIds: [...onlineUsers.sockets.keys()] })

    socket.on('conversation:join', async (conversationId) => {
      if (!isObjectId(conversationId)) return socket.emit('socket:error', { message: 'Invalid conversation identifier' })
      const conversation = await Conversation.findOne({ _id: conversationId, participants: userId }).select('_id')
      if (!conversation) return socket.emit('socket:error', { message: 'Conversation access denied' })
      socket.join(conversationId)
      onlineUsers.activeConversations.set(userKey, conversationId)
    })

    socket.on('conversation:leave', (conversationId) => {
      if (isObjectId(conversationId)) socket.leave(conversationId)
      if (onlineUsers.activeConversations.get(userKey) === conversationId) onlineUsers.activeConversations.delete(userKey)
    })

    socket.on('message:send', async (payload, acknowledge = () => {}) => {
      try {
        const message = await createMessage({ conversationId: payload?.conversationId, senderId: userId, text: payload?.text, io, onlineUsers })
        acknowledge({ success: true, data: { message } })
      } catch (error) {
        acknowledge({ success: false, message: error.status ? error.message : 'Message could not be sent' })
      }
    })

    for (const event of ['typing:start', 'typing:stop']) {
      socket.on(event, async ({ conversationId } = {}) => {
        if (!isObjectId(conversationId)) return
        const conversation = await Conversation.exists({ _id: conversationId, participants: userId })
        if (conversation) socket.to(conversationId).emit(event, { conversationId, userId })
      })
    }

    socket.on('message:read', ({ conversationId } = {}) => {
      if (isObjectId(conversationId)) socket.to(conversationId).emit('message:read', { conversationId, readerId: userId })
    })

    socket.on('disconnect', async () => {
      const activeSockets = onlineUsers.sockets.get(userKey)
      activeSockets?.delete(socket.id)
      if (!activeSockets?.size) {
        onlineUsers.sockets.delete(userKey)
        onlineUsers.activeConversations.delete(userKey)
        const lastSeen = new Date()
        await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen })
        io.emit('user:offline', { userId, lastSeen })
      }
    })
  })

  io.onlineUsers = onlineUsers
  return onlineUsers
}