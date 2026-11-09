import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

import {
  RATE_LIMIT_MAX_REQUESTS_AUTH,
  RATE_LIMIT_MAX_REQUESTS_DEV,
  RATE_LIMIT_MAX_REQUESTS_GLOBAL,
  RATE_LIMIT_WINDOW_MS,
  SSH_TEST_RATE_LIMIT_PER_MIN,
  TERMINAL_TICKET_RATE_LIMIT_PER_MIN
} from '@common/constants'

const isProduction = process.env.NODE_ENV === 'production'

export const globalRateLimiterMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: isProduction ? RATE_LIMIT_MAX_REQUESTS_GLOBAL : RATE_LIMIT_MAX_REQUESTS_DEV,
  standardHeaders: 'draft-8',
  legacyHeaders: false
})

export const authRateLimiterMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: isProduction ? RATE_LIMIT_MAX_REQUESTS_AUTH : RATE_LIMIT_MAX_REQUESTS_DEV,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
})

// Per user, not per IP: each test opens a real SSH connection.
export const sshTestRateLimiterMiddleware = rateLimit({
  windowMs: 60 * 1000,
  limit: SSH_TEST_RATE_LIMIT_PER_MIN,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: { error: 'Too many connection tests, please try again later.' }
})

export const terminalTicketRateLimiterMiddleware = rateLimit({
  windowMs: 60 * 1000,
  limit: TERMINAL_TICKET_RATE_LIMIT_PER_MIN,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: { error: 'Too many terminal tickets, please try again later.' }
})
