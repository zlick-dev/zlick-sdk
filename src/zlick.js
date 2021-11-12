import apiService from './services/apiService'
import CookieService from './services/CookieService'
import ZlickError from './errors/ZlickError'
import base64 from './utils/base64'
import axios from 'axios'

let ipbUrl = null

const INTENTS = {
  SUBSCRIBE: 'subscribe',
  PURCHASE: 'purchase'
}

export const CHALLENGE_STATUS = {
  ACTIVE: 'active',
  FAILED: 'failed',
  PENDING: 'pending',
  EXPIRED: 'expired'
}

export const AUTH_TYPES = {
  PINCODE_SMS: 'PINCODE_SMS', // Regular SMS pincode auth
  SMS_CONFIRMATION: 'SMS_CONFIRMATION', // Dimoco style
  CARRIER_PROXY: 'CARRIER_PROXY' // DNA in Finland
}

export const setCookie = CookieService.setCookie

export async function identifyClient (token) {
  try {
    const { data } = await apiService.headerEnrichment(token)
    const { instanceId, url } = data
    if (shouldDetectHeaders(url)) {
      await apiService.detectHeaders(url)
    }
    const userIdToken = CookieService.getUserIdFromZlickCookie()
    const identifyResponse = await apiService.identify(token, instanceId, userIdToken)

    if (identifyResponse.data.ipbUrl) {
      ipbUrl = identifyResponse.data.ipbUrl
    }

    if (!identifyResponse.data.userId) {
      return {
        userId: null,
        contentId: null,
        hasAccessRights: false,
        challengeId: identifyResponse.data.challengeId || null,
        authMethod: identifyResponse.data.authMethod,
        allowedMethods: {
          smsAuth: true
        },
        jwtToken: identifyResponse.data.token
      }
    }
    CookieService.setCookie(identifyResponse.data)
    const userAccessToContent = await apiService.userAccessToContent({ token, userId: identifyResponse.data.userId })

    const response = {
      phone: identifyResponse.data.phone || null,
      userId: identifyResponse.data.userId,
      jwtToken: identifyResponse.data.token,
      contentId: userAccessToContent.data.productName,
      transactionId: userAccessToContent.data.transactionResponse._id,
      subscriptionId: userAccessToContent.data.subscriptionResponse._id,
      hasAccessRights: userAccessToContent.data.hasAccessToContent,
      allowedMethods: allowedMethods(userAccessToContent.data)
    }

    return response
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function sendPinCodeSMS ({ token, mobilePhoneNumber, url }) {
  try {
    const startSmsAuthResponse = await apiService.smsAuthStart(token, mobilePhoneNumber, url)
    return {
      userId: null,
      contentId: null,
      hasAccessRights: false,
      allowedMethods: { verifyPinCode: true },
      jwtToken: null,
      challengeId: startSmsAuthResponse.data.challengeId,
      authMethod: startSmsAuthResponse.data.authMethod
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

export async function purchase ({ token, userId, url }) {
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
      const purchaseResponse = await apiService.purchase(token, userId, url)
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

async function subscribeByTokenAndUserId ({ token, userId, url }) {
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
      const subscribeResponse = await apiService.subscribe(token, userId, url)
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

function closeWindow(windowRef) {
  if (windowRef) {
    windowRef.close()
  }
}

export async function checkIpBillingStatus ({ challengeId, token, windowRef, timeout = 60 }) {
  return new Promise((resolve, reject) => {
    let timeCompleted = 0
    const responses = []
    const interval = setInterval(async () => {

      if (timeCompleted >= timeout) {
        const resolvedResponses = await Promise.all(responses)
        closeWindow(windowRef)
        clearInterval(interval)
        resolve({ ...resolvedResponses.pop(), status: CHALLENGE_STATUS.EXPIRED, allowedMethods: { smsAuth: true } })
        return
      }

      timeCompleted += 1
      try {
        const response = await apiService.ipBillingStatus({ token, challengeId })
        responses.push(response.data)
        const finalStatus = [CHALLENGE_STATUS.ACTIVE, CHALLENGE_STATUS.FAILED, CHALLENGE_STATUS.EXPIRED]
        if (finalStatus.includes(response.data.status)) {
          CookieService.setCookie(response.data)
          clearInterval(interval)
          closeWindow(windowRef)
          resolve({ ...response.data, allowedMethods: { smsAuth: response.data.status !== CHALLENGE_STATUS.ACTIVE } })
          return
        }
        if (windowRef && windowRef.closed) {
          clearInterval(interval)
          resolve(response.data)
        }
      } catch (error) {
        reject(new ZlickError(error))
      }
    }, 1000)
  })
}

export async function subscribeByChallengeId({ token, challengeId, url, timeout = 60 }) {
  if (!ipbUrl) {
    return { status, userIdToken: null, subscription: null }
  }
  const windowRef = window.open(`${ipbUrl}/?intent=${INTENTS.SUBSCRIBE}&clientJwtToken=${token}&challengeId=${challengeId}${url ? '&urlB64=' + base64.encode(url) : ''}`)
  return checkIpBillingStatus({ challengeId, token, windowRef, timeout })
}

export async function subscribe({ token, userId, challengeId, url, timeout = 60 }) {
  if (challengeId) {
    return subscribeByChallengeId({ token, challengeId, url, timeout })
  }
  return subscribeByTokenAndUserId({ token, userId, url })
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

export const Axios = axios