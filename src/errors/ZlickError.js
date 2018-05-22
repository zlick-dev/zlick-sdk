export default class ZlickError extends Error {
  constructor (error) {
    super()
    this.message = error.message
    this.statusCode = error.statusCode
    this.retryAttempts = error.retryAttempts
    Error.captureStackTrace(this, ZlickError)
  }
}
