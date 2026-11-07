import { NextFunction, Request, Response } from 'express'

import { REFRESH_TOKEN_COOKIE_NAME } from '@common/constants'
import { ForbiddenError, UnauthorizedError } from '@common/errors'
import { JWTService } from '@common/services'

class AuthMiddleware {
  static authenticate(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Invalid or expired access token'))
    }

    const token = authHeader.split(' ')[1]

    try {
      const payload = JWTService.verifyAccessToken(token)

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      }
      return next()
    } catch {
      return next(new UnauthorizedError('Invalid or expired access token'))
    }
  }

  static authenticateRefreshToken(req: Request, _res: Response, next: NextFunction) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    if (!refreshToken) return next(new UnauthorizedError('Invalid or expired refresh token'))

    try {
      const payload = JWTService.verifyRefreshToken(refreshToken)

      req.refreshUserId = payload.sub

      return next()
    } catch {
      return next(new UnauthorizedError('Invalid or expired refresh token'))
    }
  }

  static authorize(roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new UnauthorizedError('Unauthorized'))
      }

      if (!roles.includes(req.user.role)) {
        return next(new ForbiddenError('Forbidden'))
      }

      next()
    }
  }
}

export default AuthMiddleware
