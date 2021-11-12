/* global Image */
import Api from './Api'

/**
 * Clears undefined or empty (optional) params
 * @param {Object} params 
 * @returns {Object} params
 */
function clearParams (params) {
  return Object
    .keys(params)
    .filter(x => params[x])
    .reduce((acc, x) => {
      acc[x] = params[x]
      return acc
    }, {})
}

export default {
  identify: (token, instanceId, userId) => {
    return Api(token).post('/identify', { instanceId, userIdToken: userId || undefined })
  },
  detectHeaders: (url) => {
    const img = new Image()
    img.src = url
  },
  headerEnrichment: (token) => {
    return Api(token).get('/headerEnrichment')
  },
  userAccessToContent: ({ token, userId }) => {
    return Api(token).get('/users/' + userId + '/purchases')
  },
  purchase: (token, userId, url) => {
    return Api(token).post('/purchase', clearParams({ userId: userId, url }))
  },
  refund: (token, transactionId, refundReason) => {
    return Api(token).post('/refund', { transactionId, refundReason })
  },
  smsAuthStart: (token, phoneNumber, url) => {
    return Api(token).post('/smsauth', clearParams({ phone: phoneNumber, url }))
  },
  smsAuthComplete: (token, confirmationCode, challengeId) => {
    return Api(token).put('/smsauth', { pinCode: confirmationCode, challengeId: challengeId })
  },
  subscribe: (token, userId, url) => {
    return Api(token).post('/subscribe', clearParams({ userId, url }))
  },
  unsubscribe: ({ token, subscriptionId }) => {
    return Api(token).put('/subscriptions/' + subscriptionId, { state: 'canceled' })
  },
  ipBillingStatus: ({ token, challengeId }) => {
    return Api(token).post('/ipb/status', { challengeId })
  },
}
