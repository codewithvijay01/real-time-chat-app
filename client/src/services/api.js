import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('commonroom-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && localStorage.getItem('commonroom-token')) {
    localStorage.removeItem('commonroom-token')
    localStorage.removeItem('commonroom-user')
    if (!['/login', '/register'].includes(window.location.pathname)) window.location.assign('/login')
  }
  return Promise.reject(error)
})

export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message
  if (error.code === 'ECONNABORTED') return 'The request took too long. Please try again.'
  if (!error.response) return 'Unable to reach the server. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}

export function assetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  return `${apiUrl.replace(/\/api\/?$/, '')}${path}`
}

export default api