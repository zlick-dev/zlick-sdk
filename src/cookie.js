export default {
    clearCookie: function () {
        document.cookie = 'zlick=;max-age=0';
    },
    setCookie: function (userId) {
        const domain = document.location.hostname.split('.').slice(-2).join('.');
        // add domain after development
        document.cookie = `zlick=userId:${userId};path=/;max-age=604800`;
    },
    getUserIdFromZlickCookie: function () {
        let cookiePrefix = 'zlick=userId:';
        let cookies = document.cookie.split(';');
        
        for (let i = 0; i < cookies.length; ++i) {
            let cookie = cookies[i].trim();
            
            if (cookie.indexOf(cookiePrefix) === 0) {
                return cookie.slice(cookiePrefix.length);
            }
            return null;
        }
    }
};