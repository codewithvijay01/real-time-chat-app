import 'dotenv/config'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { Server } from 'socket.io'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import conversationRoutes from './routes/conversations.js'
import messageRoutes from './routes/messages.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { initializeSockets } from './sockets/index.js'

const app = express()
const server = http.createServer(app)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim())
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'] } })
const currentDir = path.dirname(fileURLToPath(import.meta.url))

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: allowedOrigins, credentials: false }))
app.use(express.json({ limit: '32kb' }))
app.use('/uploads', express.static(path.join(currentDir, 'uploads')))
app.use((req, res, next) => { req.io = io; next() })
app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }))
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)
app.use(notFound)
app.use(errorHandler)

app.set('onlineUsers', initializeSockets(io))

const port = Number(process.env.PORT) || 4000
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set to at least 32 characters')
  await connectDatabase()
  server.listen(port, () => console.info(`Chat API listening on http://localhost:${port}`))
} catch (error) {
  console.error(`Startup failed: ${error.message}`)
  process.exit(1)
}