import pino from 'pino'

import env from '@common/config/env'

const isProd = env.NODE_ENV === 'production'
const isTest = env.NODE_ENV === 'test'

const logger = pino({
  level: isProd ? 'info' : 'debug',

  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'refreshToken',
      'code',
      'secret',
      'passphrase',
      'encryptedSecret',
      'encryptedPassphrase'
    ],
    censor: '[REDACTED]'
  },

  ...(!isProd &&
    !isTest && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    })
})

export default logger
