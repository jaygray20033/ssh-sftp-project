import { NextFunction, Request, Response } from 'express'
import { ReasonPhrases } from 'http-status-codes'

import env from '@common/config/env'
import logger from '@common/config/logger'
import { AppError, ValidationError } from '@common/errors'

class ErrorMiddleware {
  static notFound(req: Request, res: Response) {
    res.notFound({ message: `Route ${req.originalUrl} not found` })
  }

  static errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ValidationError) {
      return res.validationError({ errors: err.errors })
    }

    if (err instanceof AppError) {
      return res.fail({ message: err.message, statusCode: err.statusCode })
    }

    logger.error(err, 'Unhandled error')
    res.internalError({
      message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      ...(env.NODE_ENV === 'development' && { errors: [{ field: 'stack', message: err.stack || '' }] })
    })
  }
}

export default ErrorMiddleware
