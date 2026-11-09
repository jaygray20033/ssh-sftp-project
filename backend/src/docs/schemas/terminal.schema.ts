import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { CreateTicketBodySchema } from '@modules/terminal/dto/create-ticket.dto'

import { errorResponse, jsonBody, successWrapper, unauthorizedResponse, validationErrorResponse } from './shared'

const TicketSchema = registry.register(
  'TerminalTicket',
  z.object({
    ticket: z.string().meta({
      example: '9f2c4a7e1b8d6035fa2c4e7b9d0136528ac4f7e1b2d9063547c8a1e2f3b4d5c6',
      description: 'One-time ticket, valid for 30 seconds'
    })
  })
)

registry.registerPath({
  method: 'post',
  path: '/terminal/tickets',
  tags: ['Terminal'],
  summary: 'Create a one-time terminal ticket',
  description:
    'Returns a ticket for `WS /api/v1/terminal/ws?ticket=...`. The ticket is single use, expires after 30 seconds ' +
    'and is bound to the current user and host, so no JWT ever goes into the WebSocket URL. ' +
    'The `Origin` header must be listed in `CLIENT_ORIGINS`.\n\n' +
    'WebSocket protocol (JSON text frames, max 64KB):\n' +
    '- client → server: `{"type":"input","data":"ls\\n"}`, `{"type":"resize","cols":120,"rows":40}`, ' +
    '`{"type":"hostkey_accept"}`, `{"type":"ping"}`\n' +
    '- server → client: `{"type":"hostkey","fingerprint":"SHA256:...","status":"new|changed"}`, `{"type":"ready"}`, ' +
    '`{"type":"data","data":"..."}`, `{"type":"error","code":"...","message":"..."}`, ' +
    '`{"type":"closed","reason":"..."}`, `{"type":"pong"}`\n\n' +
    'On a new or changed host key the server sends `hostkey` and waits up to 60 seconds for `hostkey_accept`; ' +
    'accepting stores the fingerprint. Close codes: 4401 invalid ticket/origin, 4404 host not found, ' +
    '4408 idle timeout, 4429 session limit reached, 4500 server error.',
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreateTicketBodySchema),
  responses: {
    201: {
      description: 'Ticket created',
      content: {
        'application/json': {
          schema: successWrapper(TicketSchema, '/terminal/tickets', 201, 'Terminal ticket created successfully')
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    404: errorResponse(404, 'Host not found (or belongs to another user)', 'Not Found'),
    422: validationErrorResponse(),
    429: errorResponse(429, 'Too many tickets', 'Too Many Requests')
  }
})
