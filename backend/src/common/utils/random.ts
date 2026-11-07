import { createHmac, randomBytes, randomInt } from 'crypto'

import env from '@common/config/env'

export const generateRandomDigits = (length = 6): string => {
  return Array.from({ length }, () => randomInt(10)).join('')
}

export const generateSecureToken = (): string => {
  return randomBytes(32).toString('base64url')
}

export const hashAuthToken = (token: string): string => {
  return createHmac('sha256', env.AUTH_TOKEN_HASH_SECRET).update(token).digest('hex')
}
