import { z, ZodType } from 'zod/v4'

import { registry } from '@docs/registry'

type NamedExample = { summary?: string; description?: string; value?: unknown }

export const jsonBody = (schema: ZodType, examples?: Record<string, NamedExample>) => ({
  body: {
    required: true,
    content: {
      'application/json': {
        schema,
        ...(examples && { examples })
      }
    }
  }
})

export const successWrapper = <T extends z.ZodTypeAny>(
  dataSchema: T,
  pathExample: string,
  statusCode: number = 200,
  message: string = 'OK'
) =>
  z.object({
    statusCode: z.number().meta({ example: statusCode }),
    message: z.string().meta({ example: message }),
    data: dataSchema,
    path: z.string().meta({ example: pathExample }),
    timestamp: z.string().datetime().meta({ example: '2024-01-15T10:30:00.000Z' })
  })

export const ErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 400 }),
  message: z.string().meta({ example: 'Bad Request' }),
  path: z.string().meta({ example: '/api/v1/...' }),
  timestamp: z.string().datetime().meta({ example: '2024-01-15T10:30:00.000Z' })
})

const ValidationErrorResponseSchema = z.object({
  statusCode: z.number().meta({ example: 422 }),
  message: z.string().meta({ example: 'Unprocessable Entity' }),
  path: z.string().meta({ example: '/api/v1/...' }),
  timestamp: z.string().datetime().meta({ example: '2024-01-15T10:30:00.000Z' }),
  errors: z
    .array(
      z.object({
        field: z.string().meta({ example: 'body.email' }),
        message: z.string().meta({ example: 'Invalid email' }),
        code: z.string().meta({ example: 'invalid_string' })
      })
    )
    .optional()
})

export const errorResponse = (statusCode: number, description: string, message: string) => ({
  description,
  content: {
    'application/json': {
      schema: ErrorResponseSchema.meta({
        example: { statusCode, message, path: '/api/v1/...', timestamp: '2024-01-15T10:30:00.000Z' }
      })
    }
  }
})

export const validationErrorResponse = (description: string = 'Validation error') => ({
  description,
  content: {
    'application/json': {
      schema: ValidationErrorResponseSchema.meta({
        example: {
          statusCode: 422,
          message: 'Unprocessable Entity',
          path: '/api/v1/...',
          timestamp: '2024-01-15T10:30:00.000Z',
          errors: [{ field: 'body.email', message: 'Invalid email', code: 'invalid_string' }]
        }
      })
    }
  }
})

export const badRequestResponse = (description: string = 'Bad Request') =>
  errorResponse(400, description, 'Bad Request')

export const unauthorizedResponse = (description: string = 'Unauthorized') =>
  errorResponse(401, description, 'Unauthorized')

export const conflictResponse = (description: string = 'Conflict') => errorResponse(409, description, 'Conflict')

export const forbiddenResponse = (description: string = 'Forbidden') => errorResponse(403, description, 'Forbidden')

export const notFoundResponse = (description: string = 'Not Found') => errorResponse(404, description, 'Not Found')

export const rateLimitResponse = () => errorResponse(429, 'Too many requests (rate limited)', 'Too Many Requests')

export const TokenPairSchema = registry.register(
  'TokenPair',
  z.object({
    accessToken: z.string().meta({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  })
)

export const AuthUserSchema = registry.register(
  'AuthUser',
  z.object({
    id: z.string().uuid().meta({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    username: z.string().nullable().meta({ example: 'kimnguen79' }),
    email: z.string().email().meta({ example: 'kimnguen79lc@gmail.com' }),
    fullName: z.string().meta({ example: 'Kim Nguyen' }),
    role: z.enum(['user', 'admin']).meta({ example: 'user' }),
    googleId: z.string().nullable().optional().meta({ example: null }),
    avatarUrl: z.string().url().nullable().optional().meta({ example: null }),
    isEmailVerified: z
      .boolean()
      .meta({ example: true, description: 'Whether the user has verified their email address' }),
    isTwoFactorEnabled: z
      .boolean()
      .meta({ example: false, description: 'Whether two-factor authentication is enabled' })
  })
)

export const AuthResponseSchema = registry.register(
  'AuthResponse',
  z.object({
    accessToken: z.string().meta({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    user: AuthUserSchema
  })
)
