import { Request, Response, NextFunction } from 'express'
import { z } from 'zod/v4'

import { ValidationError } from '@common/errors/'
import { ValidationErrorItem } from '@common/types/'

function createValidator(source: 'body' | 'params' | 'query') {
  return (schema: z.ZodType) => {
    return (req: Request, _res: Response, next: NextFunction) => {
      const result = schema.safeParse(req[source])

      if (!result.success) {
        const errors: ValidationErrorItem[] = result.error.issues.map((issue) => ({
          field: issue.path.length ? `${source}.${issue.path.join('.')}` : source,
          message: issue.message,
          code: issue.code
        }))
        return next(new ValidationError(errors))
      }

      if (source !== 'query') {
        req[source] = result.data
      }
      next()
    }
  }
}

export const validateBody = createValidator('body')
export const validateParam = createValidator('params')
export const validateQuery = createValidator('query')
