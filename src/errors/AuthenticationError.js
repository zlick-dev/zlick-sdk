export default class AuthenticationError extends Error {
  constructor (message, error) {
    super(error)
    this.message = error.response.data.error
    this.retryAttempts = error.response.data.attempts
    this.statusCode = error.response.status
    Error.captureStackTrace(this, AuthenticationError)
  }
}
