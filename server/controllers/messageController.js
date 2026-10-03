import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { asyncHandler, httpError, isObjectId } from '../utils/asyncHandler.js'
import { createMessage } from '../utils/messageService.js'

export async function listMessages(req, res) {
  const { conversationId } = req.params
  if (!isObjectId(conversationId)) throw httpError(400, 'Invalid conversation identifier')
  const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user._id }).select('_id')
  if (!conversation) throw httpError(404, 'Conversation not found')
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 100)
  const filter = { conversation: conversation._id, deletedFor: { $ne: req.user._id } }
  if (req.query.before) {
    if (!isObjectId(req.query.before)) throw httpError(400, 'Invalid message cursor')
    const cursor = await Message.findOne({ _id: req.query.before, conversation: conversation._id }).select('createdAt')
    if (!cursor) throw httpError(400, 'Message cursor is not part of this conversation')
    filter.createdAt = { $lt: cursor.createdAt }
  }
  const page = await Message.find(filter).populate('sender', 'name username profilePicture').populate('receiver', 'name username profilePicture').sort({ createdAt: -1 }).limit(limit + 1)
  const hasMore = page.length > limit
  const messages = page.slice(0, limit).reverse()
  res.json({ success: true, data: { messages, hasMore, nextCursor: hasMore ? messages[0]._id : null } })
}

export const sendMessage = asyncHandler(async (req, res) => {
  if (!isObjectId(req.body.conversationId)) throw httpError(400, 'Invalid conversation identifier')
  const onlineUsers = req.app.get('onlineUsers')
  const message = await createMessage({ conversationId: req.body.conversationId, senderId: req.user._id, text: req.body.text, io: req.io, onlineUsers })
  res.status(201).json({ success: true, data: { message } })
})

export async function markRead(req, res) {
  if (!isObjectId(req.params.id)) throw httpError(400, 'Invalid message identifier')
  const message = await Message.findOneAndUpdate({ _id: req.params.id, receiver: req.user._id, read: false }, { $set: { read: true } }, { new: true })
  if (!message) {
    const existing = await Message.findOne({ _id: req.params.id, conversation: { $in: await Conversation.find({ participants: req.user._id }).distinct('_id') } }).select('_id read')
    if (!existing) throw httpError(404, 'Message not found')
    return res.json({ success: true, data: { message: existing, unreadCount: await Message.countDocuments({ receiver: req.user._id, read: false }) } })
  }
  req.io.to(message.conversation.toString()).emit('message:read', { messageId: message._id, conversationId: message.conversation, readerId: req.user._id })
  const unreadCount = await Message.countDocuments({ receiver: req.user._id, read: false })
  res.json({ success: true, data: { message, unreadCount } })
}

export async function deleteMessage(req, res) {
  if (!isObjectId(req.params.id)) throw httpError(400, 'Invalid message identifier')
  const message = await Message.findById(req.params.id)
  if (!message) throw httpError(404, 'Message not found')
  const conversation = await Conversation.findOne({ _id: message.conversation, participants: req.user._id }).select('_id lastMessage')
  if (!conversation) throw httpError(404, 'Message not found')

  if (req.body?.scope === 'me') {
    await Message.updateOne({ _id: message._id }, {
      $addToSet: { deletedFor: req.user._id },
      ...(message.receiver.equals(req.user._id) ? { $set: { read: true } } : {}),
    })
    req.io.to(`user:${req.user._id}`).emit('message:deleted', { messageId: message._id, conversationId: message.conversation, scope: 'me' })
    return res.json({ success: true, data: { messageId: message._id, scope: 'me' } })
  }

  if (req.body?.scope && req.body.scope !== 'everyone') throw httpError(400, 'Invalid message deletion scope')
  if (!message.sender.equals(req.user._id)) throw httpError(403, 'Only the sender can delete this message for everyone')
  await Message.deleteOne({ _id: message._id })
  if (conversation?.lastMessage?.equals(message._id)) {
    const latestMessage = await Message.findOne({ conversation: message.conversation }).sort({ createdAt: -1 }).select('_id')
    conversation.lastMessage = latestMessage?._id || null
    await conversation.save()
  }
  req.io.to(message.conversation.toString()).emit('message:deleted', { messageId: message._id, conversationId: message.conversation, scope: 'everyone' })
  res.json({ success: true, data: { messageId: message._id, scope: 'everyone' } })
}