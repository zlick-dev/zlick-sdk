import uuid from 'uuid'
import apiService from './services/apiService'
import CookieService from './CookieService'
import jwt from 'jsonwebtoken'
import ZlickError from './errors/ZlickError'

export async function identifyClient (token) {
  try {
    const instanceId = uuid.v4()
    if (shouldDetectHeaders()) {
      await apiService.detectHeaders(instanceId)
    }
    const userId = CookieService.getUserIdFromZlickCookie()
    const identityResponse = await apiService.identify(token, instanceId, userId)

    if (!userId && responseHasUserId(identityResponse)) {
      CookieService.setCookie(identityResponse)
    }
    return createResponse(identityResponse)
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function sendPinCodeSMS ({token, mobilePhoneNumber}) {
  try {
    const startSmsAuthResponse = await apiService.smsAuthStart(token, mobilePhoneNumber)
    return startSmsAuthResponse.data.challengeId
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function verifyPinCode ({token, confirmationCode, challengeId}) {
  try {
    const completeSmsAuthResponse = await apiService.smsAuthComplete(token, confirmationCode, challengeId)
    CookieService.setCookie(completeSmsAuthResponse)
    return createResponse(completeSmsAuthResponse)
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function purchase ({token, userId}) {
  try {
    if (!userId) {
      return createResponse(token)
    } else {
      const purchaseResponse = await apiService.purchase(token, userId)
      return createResponse(purchaseResponse)
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function refundPurchase ({token, userId, refundReason}) {
  try {
    const refundResponse = await apiService.refund(token, userId, refundReason)
    return await createResponse(refundResponse)
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function subscribe ({token, userId}) {
  try {
    if (!userId) {
      return createResponse(token)
    } else {
      const subscribeResponse = await apiService.subscribe(token, userId)
      return createResponse(subscribeResponse)
    }
  } catch (error) {
    throw new ZlickError(error)
  }
}

export async function unsubscribe ({token, userId}) {
  try {
    const unsubscribeResponse = await apiService.unsubscribe(token, userId)
    return createResponse(unsubscribeResponse, userId)
  } catch (error) {
    throw new ZlickError(error)
  }
}

function shouldDetectHeaders () {
  return true
}

function createResponse (apiResponse) {
  const tokenToDecode = apiResponse.data ? apiResponse.data.token : apiResponse
  const payload = jwt.decode(tokenToDecode)
  console.log(payload)
  const allowedMethods = getAllowedMethods(payload)
  return {
    userId: payload.userId || null,
    contentId: payload.contentId || null,
    contentState: payload.contentState || null,
    subscriptionState: payload.subscriptionState || null,
    allowedMethods: allowedMethods
  }
}

function responseHasUserId (response) {
  return jwt.decode(response.data.token).userId != null
}

function getAllowedMethods (responsePayload) {
  let allowedMethods = {}

  if (responsePayload.subscriptionState && responsePayload.subscriptionState === 'active') {
    allowedMethods.unsubscribe = true
  }
  if (responsePayload.contentState && responsePayload.contentState === 'purchased' && !responsePayload.subscriptionState) {
    allowedMethods.refundPurchase = true
  }
  if (responsePayload.contentState !== 'purchased' && !responsePayload.subscriptionState && !responsePayload.carrierNotSupported) {
    allowedMethods.purchase = true
    allowedMethods.subscribe = true
  }
  if (!responsePayload.userId || responsePayload.userId == null || responsePayload.smsAuth) {
    allowedMethods.smsAuth = true
  }
  if (responsePayload.carrierNotSupported) {
    allowedMethods.paymentNotAllowed = true
  }
  return allowedMethods
}
