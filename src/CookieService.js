import jwt from 'jsonwebtoken'

export default {
  setCookie: (apiResponse) => {
    // add domain after development
    // const domain = document.location.hostname.split('.').slice(-2).join('.')
    let payload = jwt.decode(apiResponse.data.token)
    let userId = payload.userId
    let cookieMaxAge = payload.cookieMaxAge || 604800
    document.cookie = 'zlick=' + userId + ';path=/;max-age=' + cookieMaxAge
  },

  getUserIdFromZlickCookie: () => {
    let cookiePrefix = 'zlick='
    let cookiesArray = document.cookie.split(';')

    return cookiesArray.map(cookie => cookie.trim())
      .filter(cookie => cookie.substring(0, cookiePrefix.length) === cookiePrefix)
      .map(cookie => cookie.slice(cookiePrefix.length))
      .toString()
  }
}
