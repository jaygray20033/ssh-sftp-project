export const TERMINAL_WS_PATH = '/api/v1/terminal/ws'

export const TERMINAL_TICKET_BYTES = 32
export const TERMINAL_TICKET_TTL_SECONDS = 30
export const TERMINAL_TICKET_RATE_LIMIT_PER_MIN = 20

export const TERMINAL_MAX_MESSAGE_BYTES = 64 * 1024
export const TERMINAL_HOST_KEY_TIMEOUT_MS = 60_000
export const TERMINAL_PING_INTERVAL_MS = 30_000
export const TERMINAL_TERM = 'xterm-256color'
export const TERMINAL_DEFAULT_COLS = 80
export const TERMINAL_DEFAULT_ROWS = 24
export const TERMINAL_MAX_COLS = 500
export const TERMINAL_MAX_ROWS = 500

// 4xxx are private-use close codes, safe to send to browsers.
export const TerminalCloseCode = {
  NORMAL: 1000,
  UNAUTHORIZED: 4401,
  HOST_NOT_FOUND: 4404,
  IDLE_TIMEOUT: 4408,
  SESSION_LIMIT: 4429,
  SERVER_ERROR: 4500
} as const

export const TerminalErrorCode = {
  HOST_NOT_FOUND: 'HOST_NOT_FOUND',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  HOST_KEY_TIMEOUT: 'HOST_KEY_TIMEOUT',
  SHELL_FAILED: 'SHELL_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

export type TerminalErrorCode = (typeof TerminalErrorCode)[keyof typeof TerminalErrorCode]
