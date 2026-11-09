import { z } from 'zod/v4'

import {
  SshErrorCode,
  TERMINAL_MAX_COLS,
  TERMINAL_MAX_MESSAGE_BYTES,
  TERMINAL_MAX_ROWS,
  TerminalErrorCode
} from '@common/constants'

export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('input'), data: z.string().max(TERMINAL_MAX_MESSAGE_BYTES) }),
  z.object({
    type: z.literal('resize'),
    cols: z.number().int().min(1).max(TERMINAL_MAX_COLS),
    rows: z.number().int().min(1).max(TERMINAL_MAX_ROWS)
  }),
  z.object({ type: z.literal('hostkey_accept') }),
  z.object({ type: z.literal('ping') })
])

export type ClientMessage = z.infer<typeof ClientMessageSchema>

export type HostKeyStatus = 'new' | 'changed'

export type ServerMessage =
  | { type: 'hostkey'; fingerprint: string; status: HostKeyStatus }
  | { type: 'ready' }
  | { type: 'data'; data: string }
  | { type: 'error'; code: SshErrorCode | TerminalErrorCode; message: string }
  | { type: 'closed'; reason: string }
  | { type: 'pong' }
