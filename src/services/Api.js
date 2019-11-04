import axios from 'axios'
const apiBaseUrl = process.env.ZLICK_API_URL

export default (token) => {
  return axios.create({
    baseURL: apiBaseUrl,
    headers: {
      Authorization: 'Bearer ' + token
    }
  })
}
