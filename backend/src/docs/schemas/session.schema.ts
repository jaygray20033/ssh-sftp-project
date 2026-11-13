import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { ListSessionsQuerySchema } from '@modules/sessions/dto'

import { successWrapper, unauthorizedResponse, validationErrorResponse } from './shared'

const uuidExample = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const SessionLogSchema = registry.register(
  'SessionLog',
  z.object({
    id: z.uuid().meta({ example: uuidExample }),
    // null when the host was deleted after the session.
    hostId: z.uuid().nullable().meta({ example: uuidExample }),
    hostLabel: z.string().meta({ example: 'Dev server' }),
    startedAt: z.iso.datetime().meta({ example: '2026-01-15T10:30:00.000Z' }),
    endedAt: z.iso.datetime().nullable().meta({ example: '2026-01-15T11:05:00.000Z' }),
    clientIp: z.string().meta({ example: '203.0.113.5' }),
    closeReason: z.string().nullable().meta({ example: 'Client disconnected' }),
    // True when the host had session recording enabled and an asciicast file exists.
    hasRecording: z.boolean().meta({ example: false })
  })
)

const PaginatedSessionLogsSchema = z.object({
  entries: z.array(SessionLogSchema),
  limit: z.number().meta({ example: 20 }),
  offset: z.number().meta({ example: 0 }),
  total_count: z.number().optional().meta({ example: 1 })
})

registry.registerPath({
  method: 'get',
  path: '/sessions',
  tags: ['Sessions'],
  summary: 'List terminal session logs (paginated)',
  description:
    'Audit trail of terminal sessions for the current user. ' +
    'Only metadata (host label, times, client IP, close reason) is recorded — never keystrokes or output.',
  request: { query: ListSessionsQuerySchema },
  responses: {
    200: {
      description: 'Paginated session logs, newest first',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ sessions: PaginatedSessionLogsSchema }), '/sessions', 200, 'OK')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/sessions/{id}/recording',
  tags: ['Sessions'],
  summary: 'Download the asciicast v2 recording of a session',
  description:
    'Available only when the host had `recordSessions` enabled. The file can be replayed with asciinema ' +
    '(frontend: asciinema-player, Apache-2.0). WARNING: the recording may contain typed passwords.',
  request: { params: z.object({ id: z.uuid().meta({ example: uuidExample }) }) },
  responses: {
    200: {
      description: 'asciicast v2 file',
      content: { 'text/x-asciicast': { schema: z.string() } }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: { description: 'Session log not found, or no recording exists for it' }
  }
})
