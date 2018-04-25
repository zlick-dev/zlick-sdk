import apiService from './services/apiService';
import cookie from './cookie';
import logger from './util/logger';
import util from './util/util';
import jwt from 'jsonwebtoken';
/**
 * @param  {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @async
 * @function initZlick
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function initZlick(token) {
    try {
        const instanceId = util.uuidv4();

        // await cookie.setCookie('6e58cc3a-34ce-4cb5-9fc5-5a7358e13108');

        if (shouldDetectHeaders()) {
             await apiService.detectHeaders(instanceId);
        }
        const userId = await cookie.getUserIdFromZlickCookie();
        const identityResponse = await apiService.identify(token, instanceId, userId);

        return createResponse(identityResponse);
    } catch (error) {
        throw error;
    }
}
/**
 * @param  {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @param {String} userId Zlick userID
 * @async
 * @function purchase
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function purchase(token, userId) {
    try {
        if (userId == null) {
            return createResponse(token);
        } else {
            const purchaseResponse = await apiService.purchase(token, userId);
            if (smsAuhtNeeded(purchaseResponse)) {
                return createResponse(token);
            } else {
                return createResponse(purchaseResponse, userId)
            }
        }
    } catch (error) {
        throw error;
    } 
}
/**
 * @param  {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @param {String} userId Zlick userID
 * @async
 * @function subscribe
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function subscribe(token, userId) {
    try {
        if (userId == null) {
            return createResponse(token);
        } else {
            const subscribeResponse = await apiService.subscribe(token, userId);
            if (smsAuhtNeeded(subscribeResponse)) {
                return createResponse(token);
            } else {
                return createResponse(subscribeResponse, userId)
            }
        }
    } catch (error) {
        throw error;
    }
}
/**
 * @param  {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @param {String} userId Zlick userID
 * @async
 * @function unsubscribe
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function unsubscribe(token, userId) {
    try {
        const unsubscribeResponse = await apiService.unsubscribe(token, userId);
        return createResponse(unsubscribeResponse, userId)
    } catch (error) {
        throw error;
    }
        
}
/**
 * @param  {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @param {String} userId Zlick userID
 * @param {string} refundReason reason to refund purchase
 * @async
 * @function refund
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function refund(token, userId, refundReason) {
    try {
        const refundResponse = await apiService.refund(token, userId, refundReason);
        return await createResponse(refundResponse);
    } catch (error) {
        throw error;
    }
}
/**
 * @param  {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @param {String} mobilePhoneNumber customer mobile number that starts SMS authentication
 * @async
 * @function startSmsAuth
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function startSmsAuth(token, mobilePhoneNumber) {
    try {
        const startSmsAuthResponse = await apiService.smsAuthStart(token, mobilePhoneNumber);
        return createResponse(token, startSmsAuthResponse.data.challengeId);
    } catch(error) {
        throw error;
    }  
}
/**
 * @param {String} token JWT token, signed with HS265 alorithm, containing purchase payload
 * @param {String} confirationCode 4 digit confirmation code sent to customers mobile number via SMS
 * @param {String} challengeId id created by zlick and sent via smsAuthStart method to verify mobile number and challenge ID
 * @param {String} paymentMethod can be either purchase or subscribe. Payment mehtod one wishes to trigger on successful SMS auhentication
 * @async
 * @function completeSmsAuth
 * @returns {Promise} Promise that returns object containing UserId, contentId, contentState, subscripionState, challengeId and allowedMethods.
 * @throws {error} throws error containing error code and reason if function fails.
 */
export async function completeSmsAuth(token, confirmationCode, challengeId, paymentMethod) {
   try {
        const completeSmsAuthResponse = await apiService.smsAuthComplete(token, confirmationCode, challengeId);
        if (hasAccessRights(completeSmsAuthResponse)) {
            return createResponse(completeSmsAuthResponse);
        } else {
            const userId = getUserIdFromToken(completeSmsAuthResponse);
            
            if (paymentMethod === 'purchase') {
                return purchase(token, userId);
            } else if (paymentMethod === 'subscribe'){
                return subscribe(token, userId);    
            } else {
                logger.send('unknown caller, no return function');
            } 
        }      
    } catch(error) {
        throw error;
    }
}


function shouldDetectHeaders() {
    return true;
}

function createResponse(apiResponse, challengeId) {
    const tokenToDecode = apiResponse.data ? apiResponse.data.token : apiResponse;
    const payload = jwt.decode(tokenToDecode);
    const allowedMethods = getAllowedMethods(payload);
    return {
        userId: payload.userId || null,
        contentId: payload.contentId || null,
        contentState: payload.contentState || null,
        subscriptionState: payload.subscriptionState || null,
        challengeId: challengeId || null,
        allowedMethods: allowedMethods
    };
}

function smsAuhtNeeded(purchaseResponse) {
    return jwt.decode(purchaseResponse.data.token).smsAuth === true;
}

function getUserIdFromToken(completeSmsAuthResponse) {
    return jwt.decode(completeSmsAuthResponse.data.token).userId;
}

function hasAccessRights(completeSmsAuthResponse) {
    return jwt.decode(completeSmsAuthResponse.data.token).contentState === 'purchased';
}

function getAllowedMethods(responsePayload) {
    let allowedMethods = {};

    if (responsePayload.subscriptionState && responsePayload.subscriptionState === 'active') {
        allowedMethods.unsubscribe = true;
    }

    if (responsePayload.contentState && responsePayload.contentState === 'purchased' && !responsePayload.subscriptionState) {
        allowedMethods.refund = true;
    }

    if (responsePayload.contentState !== 'purchased' && !responsePayload.subscriptionState) {
        allowedMethods.purchase = true;
        allowedMethods.subscribe = true;
    }

    if (!responsePayload.userId || responsePayload.userId == null) {
        allowedMethods.smsAuth = true;
    }
    return allowedMethods;
}