export const AuthType = {
  PASSWORD: 'password',
  PRIVATE_KEY: 'private_key'
} as const

export type AuthType = (typeof AuthType)[keyof typeof AuthType]

export const HOST_SECRET_MAX_LENGTH = 16 * 1024
export const HOST_MAX_TAGS = 10

export const SshErrorCode = {
  AUTH_FAILED: 'AUTH_FAILED',
  TIMEOUT: 'TIMEOUT',
  REFUSED: 'REFUSED',
  HOST_KEY_CHANGED: 'HOST_KEY_CHANGED',
  HOST_KEY_UNVERIFIED: 'HOST_KEY_UNVERIFIED',
  CONNECTION_FAILED: 'CONNECTION_FAILED'
} as const

export type SshErrorCode = (typeof SshErrorCode)[keyof typeof SshErrorCode]

export const SSH_READY_TIMEOUT_MS = 10_000
export const SSH_KEEPALIVE_INTERVAL_MS = 15_000
export const SSH_TEST_RATE_LIMIT_PER_MIN = 10
