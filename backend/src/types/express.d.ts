import { Response as ExpressResponse } from 'express'

import { GoogleProfile, ResponseType } from '@common/types/index'

type SuccessPayload = ResponseType.SuccessPayload
type ErrorPayload = ResponseType.ErrorPayload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
      refreshUserId?: string
      profileGoogle?: GoogleProfile
    }
    interface Response {
      ok<T>(data: T, payload?: SuccessPayload): ExpressResponse
      created<T>(data: T, payload?: SuccessPayload): ExpressResponse
      fail(payload?: ErrorPayload): ExpressResponse
      notFound(payload?: ErrorPayload): ExpressResponse
      validationError(payload?: ErrorPayload): ExpressResponse
      internalError(payload?: ErrorPayload): ExpressResponse
    }
  }
}

export {}
