import { env } from '@common/config'

export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const AUTH_TOKEN = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD'
} as const

export type AuthTokenType = (typeof AUTH_TOKEN)[keyof typeof AUTH_TOKEN]

export const GOOGLE_AUTH = {
  URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  SCOPE: ['openid', 'email', 'profile'].join(' '),
  VERIFY_TOKEN_URL: 'https://oauth2.googleapis.com/token',
  USERINFO_URL: 'https://www.googleapis.com/oauth2/v2/userinfo'
}

export const VERIFY_EMAIL_EXPIRE_MINUTES = env.VERIFY_EMAIL_EXPIRE_MINUTES
export const RESET_PASSWORD_EXPIRE_MINUTES = env.RESET_PASSWORD_EXPIRE_MINUTES

export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth'
export const REFRESH_TOKEN_COOKIE_NAME = 'rt'

export const TOKEN_LENGTH = 6
