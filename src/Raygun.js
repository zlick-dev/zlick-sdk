import rg4js from 'raygun4js'
rg4js('apiKey', process.env.RAYGUN_API_KEY)
rg4js('enableCrashReporting', true)

export default {
  send: (error) => {
    rg4js('send', error)
  }
}
