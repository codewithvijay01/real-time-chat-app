import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  username: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 24, match: /^[a-z0-9_]+$/ },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
  profilePicture: { type: String, default: '' },
  bio: { type: String, trim: true, maxlength: 180, default: '' },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true })

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ username: 1 }, { unique: true })
userSchema.index({ name: 'text', username: 'text', email: 'text' })

export default mongoose.model('User', userSchema)