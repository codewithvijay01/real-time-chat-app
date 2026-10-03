import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api.js'
import { disconnectSocket } from '../services/socket.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('commonroom-user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('commonroom-token')))

  useEffect(() => {
    if (!localStorage.getItem('commonroom-token')) return
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.data.user)
        localStorage.setItem('commonroom-user', JSON.stringify(data.data.user))
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const acceptSession = ({ user: nextUser, token }) => {
    localStorage.setItem('commonroom-token', token)
    localStorage.setItem('commonroom-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const login = async (values) => {
    const { data } = await api.post('/auth/login', values)
    acceptSession(data.data)
    return data.data.user
  }

  const register = async (values) => {
    const { data } = await api.post('/auth/register', values, { headers: { 'Content-Type': 'multipart/form-data' } })
    acceptSession(data.data)
    return data.data.user
  }

  const updateUser = (nextUser) => {
    setUser(nextUser)
    localStorage.setItem('commonroom-user', JSON.stringify(nextUser))
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* Local credentials are cleared even if the server is unreachable. */ }
    localStorage.removeItem('commonroom-token')
    localStorage.removeItem('commonroom-user')
    disconnectSocket()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}