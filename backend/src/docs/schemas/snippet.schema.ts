import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { CreateSnippetBodySchema, ListSnippetsQuerySchema, UpdateSnippetBodySchema } from '@modules/snippets/dto'

import { conflictResponse, jsonBody, successWrapper, unauthorizedResponse, validationErrorResponse } from './shared'

const uuidExample = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const SnippetSchema = registry.register(
  'Snippet',
  z.object({
    id: z.uuid().meta({ example: uuidExample }),
    name: z.string().meta({ example: 'Disk usage' }),
    command: z.string().meta({ example: 'df -h' }),
    description: z.string().nullable().meta({ example: 'Show free disk space' }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
)

const PaginatedSnippetsSchema = z.object({
  entries: z.array(SnippetSchema),
  limit: z.number().meta({ example: 20 }),
  offset: z.number().meta({ example: 0 }),
  total_count: z.number().optional().meta({ example: 1 })
})

const security = [{ bearerAuth: [] }]
const notFound = { description: 'Snippet not found (or belongs to another user)' }

registry.registerPath({
  method: 'get',
  path: '/snippets',
  tags: ['Snippets'],
  summary: 'List snippets (paginated, sorted by name)',
  security,
  request: { query: ListSnippetsQuerySchema },
  responses: {
    200: {
      description: 'Paginated snippets of the current user',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ snippets: PaginatedSnippetsSchema }), '/snippets', 200, 'OK')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/snippets/{id}',
  tags: ['Snippets'],
  summary: 'Get a snippet',
  security,
  request: { params: z.object({ id: z.uuid().meta({ example: uuidExample }) }) },
  responses: {
    200: {
      description: 'Snippet details',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ snippet: SnippetSchema }), '/snippets/{id}', 200, 'OK')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFound
  }
})

registry.registerPath({
  method: 'post',
  path: '/snippets',
  tags: ['Snippets'],
  summary: 'Create a snippet',
  description: 'The command is never executed by the backend; the frontend types it into the terminal.',
  security,
  request: jsonBody(CreateSnippetBodySchema),
  responses: {
    201: {
      description: 'Snippet created',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ snippet: SnippetSchema }), '/snippets', 201, 'Snippet created successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    409: conflictResponse('A snippet with this name already exists'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/snippets/{id}',
  tags: ['Snippets'],
  summary: 'Update a snippet',
  security,
  request: { params: z.object({ id: z.uuid().meta({ example: uuidExample }) }), ...jsonBody(UpdateSnippetBodySchema) },
  responses: {
    200: {
      description: 'Snippet updated',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ snippet: SnippetSchema }),
            '/snippets/{id}',
            200,
            'Snippet updated successfully'
          )
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFound,
    409: conflictResponse('A snippet with this name already exists'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/snippets/{id}',
  tags: ['Snippets'],
  summary: 'Delete a snippet',
  security,
  request: { params: z.object({ id: z.uuid().meta({ example: uuidExample }) }) },
  responses: {
    200: {
      description: 'Snippet deleted',
      content: {
        'application/json': {
          schema: successWrapper(z.object({}), '/snippets/{id}', 200, 'Snippet deleted successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFound
  }
})
