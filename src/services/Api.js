import axios from 'axios';
let apiBaseUrl = 'https://1ew8vpkm7e.execute-api.eu-west-1.amazonaws.com/dev/api/v1';

export default (token) => {
    return axios.create({
        baseURL: apiBaseUrl,
        headers: {
            'Content-Type': 'application/json',
            'zlick-referer': window.location.href,
            'zlick-token': token
        }
    });
};