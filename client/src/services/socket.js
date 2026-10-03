import { io } from 'socket.io-client'

let socket

export function getSocket(token) {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      autoConnect: false,
      auth: { token },
      reconnectionAttempts: 8,
      timeout: 10000,
    })
  } else {
    socket.auth = { token }
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = undefined
}