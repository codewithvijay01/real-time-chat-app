import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads', 'avatars')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, done) => {
    const extension = path.extname(file.originalname).toLowerCase()
    done(null, `${Date.now()}-${crypto.randomUUID()}${extension}`)
  },
})

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) return done(new Error('Profile picture must be a JPEG, PNG, WebP, or GIF image'))
    done(null, true)
  },
})