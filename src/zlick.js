import apiService from './services/apiService'
import CookieService from './services/CookieService'
import ZlickError from './errors/ZlickError'

export async function identifyClient (token) {
  try {
    const { data } = await apiService.headerEnrichment(token)
    const { instanceId, url } = data
    if (shouldDetectHeaders(url)) {
      await apiService.detectHeaders(url)
    }
    const userIdToken = CookieService.getUserIdFromZlickCookie()
    const identifyResponse = await apiService.identify(token, instanceId, userIdToken)

    if (!identifyResponse.data.userId) {
      return {
        userId: null,
        contentId: null,
        hasAccessRights: false,
        allowedMethods: {
          smsAuth: true
        },
        jwtToken: identifyResponse.data.token
      }
    }
    CookieService.setCookie(identifyResponse.data)
    const userAccessToContent = await apiService.userAccessToContent({ token, userId: identifyResponse.data.userId })

    return {
      userId: identifyResponse.data.userId,
      jwtToken: identifyResponse.data.token,
      contentId: userAccessToContent.data.productName,
      transactionId: userAccessToContent.data.transactionResponse._id,
      subscriptionId: userAccessToContent.data.subscriptionResponse._id,
      hasAccessRights: userAccessToContent.data.hasAccessToContent,
      allowedMethods: allowedMethods(userAccessToContent.data)
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function sendPinCodeSMS ({ token, mobilePhoneNumber }) {
  try {
    const startSmsAuthResponse = await apiService.smsAuthStart(token, mobilePhoneNumber)
    return {
      userId: null,
      contentId: null,
      hasAccessRights: false,
      allowedMethods: { verifyPinCode: true },
      jwtToken: null,
      challengeId: startSmsAuthResponse.data.challengeId
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function verifyPinCode ({ token, confirmationCode, challengeId }) {
  try {
    const completeSmsAuthResponse = await apiService.smsAuthComplete(token, confirmationCode, challengeId)
    const userAccessToContent = await apiService.userAccessToContent({ token, userId: completeSmsAuthResponse.data.userId })
    CookieService.setCookie(completeSmsAuthResponse.data)
    return {
      userId: completeSmsAuthResponse.data.userId,
      jwtToken: completeSmsAuthResponse.data.token,
      contentId: userAccessToContent.data.productName,
      transactionId: userAccessToContent.data.transactionResponse._id,
      subscriptionId: userAccessToContent.data.subscriptionResponse._id,
      hasAccessRights: userAccessToContent.data.hasAccessToContent,
      allowedMethods: allowedMethods(userAccessToContent.data)
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function purchase ({ token, userId }) {
  try {
    if (!userId) {
      return {
        userId: null,
        contentId: null,
        hasAccessRights: false,
        allowedMethods: {
          smsAuth: true
        },
        jwtToken: null
      }
    } else {
      const purchaseResponse = await apiService.purchase(token, userId)
      return {
        userId: purchaseResponse.data.userId,
        jwtToken: purchaseResponse.data.token,
        contentId: purchaseResponse.data.content,
        transactionId: purchaseResponse.data._id,
        hasAccessRights: true,
        allowedMethods: {
          refundPurchase: true
        }
      }
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function refundPurchase ({ token, transactionId, refundReason }) {
  try {
    const refundResponse = await apiService.refund(token, transactionId, refundReason)
    return {
      userId: refundResponse.data.userId,
      jwtToken: refundResponse.data.token,
      contentId: refundResponse.data.content,
      transactionId: refundResponse.data._id,
      hasAccessRights: true,
      allowedMethods: {
        purchase: true
      }
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function subscribe ({ token, userId }) {
  try {
    if (!userId) {
      return {
        userId: null,
        contentId: null,
        hasAccessRights: false,
        allowedMethods: {
          smsAuth: true
        },
        jwtToken: null
      }
    } else {
      const subscribeResponse = await apiService.subscribe(token, userId)
      return {
        userId: subscribeResponse.data.userId,
        jwtToken: subscribeResponse.data.token,
        contentId: subscribeResponse.data.subscriptionId,
        subscriptionId: subscribeResponse.data._id,
        hasAccessRights: true,
        allowedMethods: {
          unsubscribe: true
        }
      }
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function unsubscribe ({ token, subscriptionId }) {
  try {
    const unsubscribeResponse = await apiService.unsubscribe({ token, subscriptionId })
    return {
      userId: unsubscribeResponse.data.userId,
      jwtToken: unsubscribeResponse.data.token,
      contentId: unsubscribeResponse.data.subscriptionId,
      transactionId: unsubscribeResponse.data._id,
      hasAccessRights: true,
      allowedMethods: {
        subscribe: true
      }
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

function shouldDetectHeaders (url) {
  return !!url
}

function allowedMethods (response) {
  const allowedMethods = {}
  allowedMethods.sendPinCode = true

  if (response.hasAccessToContent) {
    if (response.transactionResponse._id) allowedMethods.refundPurchase = true
    if (response.subscriptionResponse._id) allowedMethods.unsubscribe = true
  } else {
    allowedMethods.purchase = true
    allowedMethods.subscribe = true
  }
  return allowedMethods
}
