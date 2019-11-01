export default {
  setCookie: (apiResponse) => {
    console.log(apiResponse)
    const domain = document.location.hostname.split('.').slice(-2).join('.')
    const userIdToken = apiResponse.userIdToken
    let cookieMaxAge = 604800
    document.cookie = 'zlick=' + userIdToken + ';domain=.' + domain + ';path=/;max-age=' + cookieMaxAge
  },

  getUserIdFromZlickCookie: () => {
    let cookiePrefix = 'zlick='
    let cookiesArray = document.cookie.split(';')

    const zlickCookie = cookiesArray
      .map(cookie => cookie.trim())
      .filter(cookie => cookie.substring(0, cookiePrefix.length) === cookiePrefix)
      .map(cookie => cookie.slice(cookiePrefix.length))
      .filter(x => x.indexOf('userId') === -1)
      .toString()
    
    return zlickCookie
  }
}
