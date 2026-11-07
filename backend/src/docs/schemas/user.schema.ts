import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { UpdateUserBodySchema, UpdateUserPasswordBodySchema } from '@modules/user/dto'

import {
  successWrapper,
  jsonBody,
  unauthorizedResponse,
  conflictResponse,
  validationErrorResponse,
  badRequestResponse,
  notFoundResponse,
  AuthUserSchema
} from './shared'

registry.registerPath({
  method: 'get',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Get current user profile',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile',
      content: {
        'application/json': {
          schema: successWrapper(AuthUserSchema, '/users/me')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFoundResponse('User not found')
  }
})

registry.registerPath({
  method: 'patch',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Update current user profile',
  security: [{ bearerAuth: [] }],
  request: jsonBody(UpdateUserBodySchema),
  responses: {
    200: {
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: successWrapper(AuthUserSchema, '/users/me', 200, 'User updated successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFoundResponse('User not found'),
    409: conflictResponse('Username already taken'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/users/me/password',
  tags: ['Users'],
  summary: 'Change current user password',
  security: [{ bearerAuth: [] }],
  request: jsonBody(UpdateUserPasswordBodySchema),
  responses: {
    200: {
      description: 'Password updated successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/users/me/password', 200, 'Password updated successfully')
        }
      }
    },
    400: badRequestResponse('Incorrect current password or account has no password set'),
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFoundResponse('User not found'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Delete current user account',
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: 'Account deleted successfully'
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFoundResponse('User not found')
  }
})
