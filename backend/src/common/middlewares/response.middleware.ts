import { instanceToPlain } from 'class-transformer'
import { Request, Response, NextFunction } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'

import { ApiErrorResponse, ApiSuccessResponse, ErrorPayload, SuccessData, SuccessPayload } from '@common/types'

class ResponseMiddleware {
  static extendResponse = (_req: Request, res: Response, next: NextFunction) => {
    res.ok = <T>(data: T, payload?: SuccessPayload) => {
      return ResponseMiddleware.sendSuccess(res, data, StatusCodes.OK, ReasonPhrases.OK, payload)
    }

    res.created = <T>(data: T, payload?: SuccessPayload) => {
      return ResponseMiddleware.sendSuccess(res, data, StatusCodes.CREATED, ReasonPhrases.CREATED, payload)
    }

    res.notFound = (payload?: ErrorPayload) => {
      return ResponseMiddleware.sendError(res, StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND, payload)
    }

    res.fail = (payload?: ErrorPayload) => {
      return ResponseMiddleware.sendError(
        res,
        payload?.statusCode || StatusCodes.BAD_REQUEST,
        payload?.message || ReasonPhrases.BAD_REQUEST,
        payload
      )
    }

    res.validationError = (payload?: ErrorPayload) => {
      return ResponseMiddleware.sendError(
        res,
        payload?.statusCode || StatusCodes.UNPROCESSABLE_ENTITY,
        payload?.message || ReasonPhrases.UNPROCESSABLE_ENTITY,
        payload
      )
    }

    res.internalError = (payload?: ErrorPayload) => {
      return ResponseMiddleware.sendError(
        res,
        payload?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        payload?.message || ReasonPhrases.INTERNAL_SERVER_ERROR,
        payload
      )
    }
    next()
  }

  private static sendSuccess<T>(
    res: Response,
    data: SuccessData<T>,
    statusCode: number = StatusCodes.OK,
    defaultMessage: string = ReasonPhrases.OK,
    payload?: SuccessPayload
  ) {
    const message = payload?.message || defaultMessage
    const response: ApiSuccessResponse<T> = {
      statusCode,
      message,
      data: instanceToPlain(data) as SuccessData<T>,
      path: res.req.originalUrl,
      timestamp: new Date().toISOString()
    }
    return res.status(statusCode).json(response)
  }

  private static sendError(
    res: Response,
    statusCode: number = StatusCodes.BAD_REQUEST,
    defaultMessage: string = ReasonPhrases.BAD_REQUEST,
    payload?: ErrorPayload
  ) {
    const message = payload?.message || defaultMessage
    const response: ApiErrorResponse = {
      statusCode,
      message,
      path: res.req.originalUrl,
      timestamp: new Date().toISOString(),
      errors: payload?.errors
    }
    return res.status(statusCode).json(response)
  }
}

export default ResponseMiddleware
