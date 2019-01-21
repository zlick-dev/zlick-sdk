export default class ZlickError extends Error {
  constructor (error) {
    super()
    this.message = error.response.data.message
    this.statusCode = error.response.data.statusCode
    this.zlickErrorCode = error.response.data.zlickErrorCode
  }
}
