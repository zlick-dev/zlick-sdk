export default class ApiError extends Error {
  constructor (message, error) {
    super()
    this.message = error.response != null ? error.response.data.error : message
    this.statusCode = error.response != null ? error.response.status : undefined
  }
}
