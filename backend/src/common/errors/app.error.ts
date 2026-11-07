import { StatusCodes, ReasonPhrases } from 'http-status-codes'

import { ValidationErrorItem } from '@common/types/response.type'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = ReasonPhrases.BAD_REQUEST) {
    super(StatusCodes.BAD_REQUEST, message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ReasonPhrases.UNAUTHORIZED) {
    super(StatusCodes.UNAUTHORIZED, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ReasonPhrases.FORBIDDEN) {
    super(StatusCodes.FORBIDDEN, message)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ReasonPhrases.NOT_FOUND) {
    super(StatusCodes.NOT_FOUND, message)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = ReasonPhrases.CONFLICT) {
    super(StatusCodes.CONFLICT, message)
  }
}

export class ValidationError extends AppError {
  constructor(public errors: ValidationErrorItem[]) {
    super(StatusCodes.UNPROCESSABLE_ENTITY, ReasonPhrases.UNPROCESSABLE_ENTITY)
  }
}
