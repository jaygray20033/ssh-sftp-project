import { rateLimit } from 'express-rate-limit'

import {
  RATE_LIMIT_MAX_REQUESTS_AUTH,
  RATE_LIMIT_MAX_REQUESTS_DEV,
  RATE_LIMIT_MAX_REQUESTS_GLOBAL,
  RATE_LIMIT_WINDOW_MS
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
