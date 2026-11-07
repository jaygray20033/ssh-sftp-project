import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import env from '@common/config/env'
import { globalRateLimiterMiddleware, ResponseMiddleware } from '@common/middlewares'

export function applySecurityMiddlewares(app: express.Application): void {
  app.use(
    cors({
      origin: env.CLIENT_ORIGINS,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )

  app.use(helmet(env.NODE_ENV === 'production' ? {} : { contentSecurityPolicy: false }))

  app.use(compression())
  app.use(globalRateLimiterMiddleware)
}

export function applyAppMiddlewares(app: express.Application): void {
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())
  app.use(ResponseMiddleware.extendResponse)
}
