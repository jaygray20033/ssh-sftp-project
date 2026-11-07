export const AuthType = {
  PASSWORD: 'password',
  PRIVATE_KEY: 'private_key'
} as const

export type AuthType = (typeof AuthType)[keyof typeof AuthType]

export const HOST_SECRET_MAX_LENGTH = 16 * 1024
export const HOST_MAX_TAGS = 10
