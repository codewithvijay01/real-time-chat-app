export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value))
}

export function publicUser(user) {
  if (!user) return null
  const value = user.toObject ? user.toObject() : user
  delete value.password
  return value
}