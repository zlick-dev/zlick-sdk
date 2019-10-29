export default {
  setCookie: (apiResponse) => {
    console.log(apiResponse)
    const domain = document.location.hostname.split('.').slice(-2).join('.')
    const userIdToken = apiResponse.userIdToken
    const cookieMaxAge = 604800
    document.cookie = 'zlick=' + userIdToken + ';domain=.' + domain + ';path=/;max-age=' + cookieMaxAge
  },

  getUserIdFromZlickCookie: () => {
    const cookiePrefix = 'zlick='
    const cookiesArray = document.cookie.split(';')

    return cookiesArray
      .map(cookie => cookie.trim())
      .filter(cookie => cookie.substring(0, cookiePrefix.length) === cookiePrefix)
      .map(cookie => cookie.slice(cookiePrefix.length))
      .toString()
  }
}
