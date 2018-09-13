import Api from './Api'
import ApiError from '../errors/ApiError'
import AuthenticationError from '../errors/AuthenticationError'

export default {
  identify: (token, instanceId, userId) => {
    return Api(token).get('/identify', {
      params: {
        instance: instanceId,
        userId: userId
      }
    }).catch(error => {
      throw new ApiError('Failed to make identify request with error message: ' + error.message, error)
    })
  },
  detectHeaders: (instanceId) => {
    let img = new Image()
    img.src = 'http://api.zlick.it/api/zlick.gif?instance=' + instanceId
  },
  purchase: (token, userId) => {
    return Api(token).post('/purchase', {userId: userId})
      .catch(error => {
        throw new ApiError('Failed to make purchase request with error message: ' + error.message, error)
      })
  },
  refund: (token, userId, refundReason) => {
    return Api(token).post('/refund', {userId: userId, reason: refundReason})
      .catch(error => {
        throw new ApiError('Failed to make smsAuthStart request with error message: ' + error.message, error)
      })
  },
  smsAuthStart: (token, phoneNumber) => {
    return Api(token).post('/smsauth/start', {phone: phoneNumber})
      .catch((error) => {
        throw new ApiError('Failed to make smsAuthStart request with error message: ' + error.message, error)
      })
  },
  smsAuthComplete: (token, confirmationCode, challengeId) => {
    return Api(token).post('/smsauth/complete', {code: confirmationCode, challengeId: challengeId})
      .catch(error => {
        if (error.response && error.response.data.attempts > 0) {
          throw new AuthenticationError('Wrong PIN code', error)
        } else {
          throw new ApiError('Failed to make smsAuthComplete request with error message: ' + error.message, error)
        }
      })
  },
  unsubscribe: (token, userId) => {
    return Api(token).post('/unsubscribe', {userId})
      .catch(error => {
        throw new ApiError('Failed to make unsubscribe request with error message ' + error.message, error)
      })
  },
  subscribe: (token, userId) => {
    return Api(token).post('/subscribe', {userId})
      .catch(error => {
        throw new ApiError('Failed to make subscribe request with error message ' + error.message, error)
      })
  }
}
