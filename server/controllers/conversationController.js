import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { httpError, isObjectId } from '../utils/asyncHandler.js'

export async function listConversations(req, res) {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name username profilePicture status lastSeen bio')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name username' } })
    .sort({ updatedAt: -1 })
  const unread = await Message.aggregate([
    { $match: { receiver: req.user._id, read: false, conversation: { $in: conversations.map((item) => item._id) } } },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ])
  const visibleLastMessages = await Promise.all(conversations.map((conversation) => {
    const lastMessage = conversation.lastMessage
    if (!lastMessage?.deletedFor?.some((userId) => userId.equals(req.user._id))) return lastMessage
    return Message.findOne({ conversation: conversation._id, deletedFor: { $ne: req.user._id } })
      .populate('sender', 'name username')
      .sort({ createdAt: -1 })
  }))
  const unreadByConversation = new Map(unread.map((item) => [item._id.toString(), item.count]))
  res.json({ success: true, data: { conversations: conversations.map((conversation, index) => ({ ...conversation.toObject(), lastMessage: visibleLastMessages[index], unreadCount: unreadByConversation.get(conversation._id.toString()) || 0 })) } })
}

export async function createConversation(req, res) {
  const { participantId } = req.body
  if (!isObjectId(participantId)) throw httpError(400, 'Invalid participant identifier')
  if (participantId === req.user._id.toString()) throw httpError(400, 'You cannot start a conversation with yourself')
  const participant = await User.findById(participantId).select('_id')
  if (!participant) throw httpError(404, 'User not found')
  let conversation = await Conversation.findOne({ participants: { $all: [req.user._id, participant._id], $size: 2 } })
  let created = false
  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user._id, participant._id] })
    created = true
  }
  await conversation.populate('participants', 'name username profilePicture status lastSeen bio')
  await conversation.populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name username' } })
  res.status(created ? 201 : 200).json({ success: true, data: { conversation: { ...conversation.toObject(), unreadCount: 0 } } })
}

export async function getConversation(req, res) {
  if (!isObjectId(req.params.id)) throw httpError(400, 'Invalid conversation identifier')
  const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    .populate('participants', 'name username profilePicture status lastSeen bio')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name username' } })
  if (!conversation) throw httpError(404, 'Conversation not found')
  const unreadCount = await Message.countDocuments({ conversation: conversation._id, receiver: req.user._id, read: false })
  res.json({ success: true, data: { conversation: { ...conversation.toObject(), unreadCount } } })
}