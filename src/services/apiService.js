import logger from '../util/logger';
import Api from './Api';

export default {
    identify: (token, instanceId, userId) => {
        return Api(token).get('/identify', {
            params: {
                instance: instanceId,
                userId: userId
            }
        }).catch((error) => {
            logger.send(error);
        });
    },
    detectHeaders: (instanceId) => {
        let img = new Image();
        img.src = 'http://api.zlick.it/api/zlick.gif?instance=' + instanceId;
    },
    purchase: (token, userId) => {
        return Api(token)
            .post('/purchase', { userId: userId }
            ).catch((error) => {
                logger.send(error);
            });
    },
    refund: (token, userId, refundReason) => {
        return Api(token)
            .post('/refund', { 
                userId: userId,
                reason: refundReason
            }).catch((error) => {
                logger.send(error);
            });
    },
    smsAuthStart: (token, phoneNumber) => {
        return Api(token)
            .post('/smsauth/start', { 
                phone: phoneNumber,
            }).catch((error) => {
                logger.send(error);
            });
    },
    smsAuthComplete: (token, confirmationCode, challengeId) => {
        return Api(token)
            .post('/smsauth/complete', { 
                code: confirmationCode,
                challengeId: challengeId
            }).catch((error) => {
                logger.send(error);
            });
    },
    unsubscribe: (token, userId) => {
        return Api(token)
            .post('/unsubscribe', { userId: userId }
            ).catch((error) => {
                logger.send(error);
            });
    },
    subscribe: (token, userId) => {
        return Api(token)
            .post('/subscribe', { userId: userId }
            ).catch((error) => {
                logger.send(error);
            });
    },
};