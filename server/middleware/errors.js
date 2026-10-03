export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0]
    return res.status(409).json({ success: false, message: `${field || 'Value'} is already in use` })
  }
  if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid identifier' })
  if (error.name === 'MulterError') return res.status(400).json({ success: false, message: error.message })
  if (status >= 500) console.error(error)
  res.status(status).json({ success: false, message: status >= 500 ? 'Something went wrong' : error.message })
}