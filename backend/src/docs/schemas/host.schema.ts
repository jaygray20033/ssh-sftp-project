import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { AuthType } from '@common/constants/host.constant'

import { CreateHostBodySchema } from '@modules/hosts/dto/create-host.dto'
import { ListHostsQuerySchema } from '@modules/hosts/dto/list-hosts.dto'
import { UpdateHostBodySchema } from '@modules/hosts/dto/update-host.dto'

import {
  conflictResponse,
  errorResponse,
  jsonBody,
  successWrapper,
  unauthorizedResponse,
  validationErrorResponse
} from './shared'

const uuidExample = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const HostSchema = registry.register(
  'Host',
  z.object({
    id: z.uuid().meta({ example: uuidExample }),
    name: z.string().meta({ example: 'Dev server' }),
    hostname: z.string().meta({ example: '192.168.1.10' }),
    port: z.number().meta({ example: 22 }),
    username: z.string().meta({ example: 'dev' }),
    authType: z.enum(Object.values(AuthType) as [AuthType, ...AuthType[]]).meta({ example: AuthType.PASSWORD }),
    tags: z.array(z.string()).meta({ example: ['dev'] }),
    hasSecret: z.boolean().meta({ example: true, description: 'Secrets are never returned, only this flag' }),
    hasPassphrase: z.boolean().meta({ example: false }),
    hostKeyFingerprint: z.string().nullable().meta({ example: null }),
    lastConnectedAt: z.iso.datetime().nullable().meta({ example: null }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
)

const PaginatedHostSchema = z.object({
  entries: z.array(HostSchema),
  limit: z.number().meta({ example: 20 }),
  offset: z.number().meta({ example: 0 }),
  total_count: z.number().optional().meta({ example: 1 })
})

const hostIdParam = z.object({ id: z.uuid().meta({ example: uuidExample }) })
const notFound = errorResponse(404, 'Host not found (or belongs to another user)', 'Not Found')
const security = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'get',
  path: '/hosts',
  tags: ['Hosts'],
  summary: 'List hosts (paginated)',
  security,
  request: { query: ListHostsQuerySchema },
  responses: {
    200: {
      description: 'Paginated list of the current user hosts',
      content: {
        'application/json': { schema: successWrapper(z.object({ hosts: PaginatedHostSchema }), '/hosts', 200, 'OK') }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/hosts/{id}',
  tags: ['Hosts'],
  summary: 'Get a host',
  security,
  request: { params: hostIdParam },
  responses: {
    200: {
      description: 'Host details',
      content: {
        'application/json': { schema: successWrapper(z.object({ host: HostSchema }), '/hosts/{id}', 200, 'OK') }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFound
  }
})

registry.registerPath({
  method: 'post',
  path: '/hosts',
  tags: ['Hosts'],
  summary: 'Create a host',
  description: 'The `secret` (password or PEM private key) is encrypted with AES-256-GCM before storage.',
  security,
  request: jsonBody(CreateHostBodySchema),
  responses: {
    201: {
      description: 'Host created',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ host: HostSchema }), '/hosts', 201, 'Host created successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    409: conflictResponse('A host with this name already exists'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'patch',
  path: '/hosts/{id}',
  tags: ['Hosts'],
  summary: 'Update a host',
  description: 'Omit `secret` to keep the stored one. Changing hostname or port clears the trusted host key.',
  security,
  request: { params: hostIdParam, ...jsonBody(UpdateHostBodySchema) },
  responses: {
    200: {
      description: 'Host updated',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ host: HostSchema }), '/hosts/{id}', 200, 'Host updated successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFound,
    409: conflictResponse('A host with this name already exists'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/hosts/{id}',
  tags: ['Hosts'],
  summary: 'Delete a host',
  description: 'Permanently deletes the host and its encrypted credentials.',
  security,
  request: { params: hostIdParam },
  responses: {
    200: {
      description: 'Host deleted',
      content: {
        'application/json': {
          schema: successWrapper(z.object({}), '/hosts/{id}', 200, 'Host deleted successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFound
  }
})
