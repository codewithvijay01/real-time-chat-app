import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { httpError } from './asyncHandler.js'

export async function createMessage({ conversationId, senderId, text, io, onlineUsers }) {
  const cleanText = typeof text === 'string' ? text.trim() : ''
  if (!cleanText || cleanText.length > 5000) throw httpError(400, 'Message must be between 1 and 5000 characters')
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) throw httpError(404, 'Conversation not found')
  if (!conversation.participants.some((participant) => participant.equals(senderId))) throw httpError(403, 'You are not a participant in this conversation')
  const receiverId = conversation.participants.find((participant) => !participant.equals(senderId))
  if (!receiverId) throw httpError(400, 'Conversation recipient is missing')
  const message = await Message.create({ conversation: conversation._id, sender: senderId, receiver: receiverId, text: cleanText })
  conversation.lastMessage = message._id
  conversation.updatedAt = new Date()
  await conversation.save()
  const populated = await Message.findById(message._id).populate('sender', 'name username profilePicture').populate('receiver', 'name username profilePicture')
  const receiverKey = receiverId.toString()
  const senderKey = senderId.toString()
  const viewing = onlineUsers?.activeConversations.get(receiverKey) === conversation._id.toString()
  const payload = { message: populated, unread: !viewing }
  for (const socketId of onlineUsers?.sockets.get(receiverKey) || []) io.to(socketId).emit('message:receive', payload)
  for (const socketId of onlineUsers?.sockets.get(senderKey) || []) io.to(socketId).emit('message:sent', populated)
  if (!viewing) {
    const unreadCount = await Message.countDocuments({ receiver: receiverId, read: false })
    for (const socketId of onlineUsers?.sockets.get(receiverKey) || []) io.to(socketId).emit('unread:update', { conversationId: conversation._id, unreadCount })
  }
  return populated
}