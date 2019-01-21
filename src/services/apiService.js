import Api from './Api'

export default {
  identify: (token, instanceId, userId) => {
    return Api(token).post('/identify', { instanceId, userIdToken: userId || undefined })

  },
  detectHeaders: (url) => {
    let img = new Image()
    img.src = url
  },
  headerEnrichment: (token) => {
    return Api(token).get('/headerEnrichment')
  },
  userAccessToContent: ({ token, userId }) => {
    return Api(token).get('/users/' + userId + '/purchases')
  },
  purchase: (token, userId) => {
    return Api(token).post('/purchase', {userId: userId})
  },
  refund: (token, transactionId, refundReason) => {
    return Api(token).post('/refund', {transactionId, refundReason})
  },
  smsAuthStart: (token, phoneNumber) => {
    return Api(token).post('/smsauth', {phone: phoneNumber})
  },
  smsAuthComplete: (token, confirmationCode, challengeId) => {
    return Api(token).put('/smsauth', {pinCode: confirmationCode, challengeId: challengeId})
  },
  subscribe: (token, userId) => {
    return Api(token).post('/subscribe', {userId})
  },
  unsubscribe: ({token, subscriptionId}) => {
    return Api(token).put('/subscriptions/' + subscriptionId, {state: 'canceled'})
  }
}
