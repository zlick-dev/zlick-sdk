import apiService from './services/apiService';
import cookie from './cookie';
import logger from './util/logger';
import util from './util/util';
import jwt from 'jsonwebtoken';
import _ from 'lodash';

export async function initZlick(token) {
    try {
        let instanceId = util.uuidv4();

        // await cookie.setCookie('6e58cc3a-34ce-4cb5-9fc5-5a7358e13108');

        if (shouldDetectHeaders()) {
             await apiService.detectHeaders(instanceId);
        }
        let userId = await cookie.getUserIdFromZlickCookie();
        let identityResponse = await apiService.identify(token, instanceId, userId);

        return createResponse(identityResponse);
    } catch (error) {
        throw error;
    }
}

export async function purchase(token, userId) {
    try {
        if (userId == null) {
            return createResponse(token);
        } else {
            let purchaseResponse = await apiService.purchase(token, userId);
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

export async function subscribe(token, userId) {
    try {
        if (userId == null) {
            return createResponse(token);
        } else {
            let subscribeResponse = await apiService.subscribe(token, userId);
    
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

export async function unsubscribe(token, userId) {
    try {
        let unsubscribeResponse = await apiService.unsubscribe(token, userId);
        return createResponse(unsubscribeResponse, userId)
    } catch (error) {
        throw error;
    }
        
}

export async function refund(token, userId, refundReason) {
    try {
        let refundResponse = await apiService.refund(token, userId, refundReason);
        return await createResponse(refundResponse);
    } catch (error) {
        throw error;
    }
}

export async function startSmsAuth(token, phone) {
    try {
        let startSmsAuthResponse = await apiService.smsAuthStart(token, phone);
        return createResponse(token, startSmsAuthResponse.data.challengeId);
    } catch(error) {
        throw error;
    }  
}

export async function completeSmsAuth(token, confirmationCode, challengeId, paymentMethod) {
   try {
        let completeSmsAuthResponse = await apiService.smsAuthComplete(token, confirmationCode, challengeId);
        if (hasAccessRights(completeSmsAuthResponse)) {
            return createResponse(completeSmsAuthResponse);
        } else {
            let userId = getUserIdFromToken(completeSmsAuthResponse);
            
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
    let tokenToDecode = apiResponse.data ? apiResponse.data.token : apiResponse;
    let payload = jwt.decode(tokenToDecode);
    let allowedMethods = getAllowedMethods(payload);
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