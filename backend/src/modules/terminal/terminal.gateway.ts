import { WebSocketServer } from 'ws'

import env from '@common/config/env'
import logger from '@common/config/logger'
import { TERMINAL_MAX_MESSAGE_BYTES, TERMINAL_WS_PATH, TerminalCloseCode } from '@common/constants'

import TerminalSession from './terminal.session'
import TicketService from './ticket.service'

import type { Server } from 'node:http'

let gateway: WebSocketServer | undefined

export const attachTerminalGateway = (server: Server): void => {
  const wss = new WebSocketServer({ noServer: true, maxPayload: TERMINAL_MAX_MESSAGE_BYTES })
  gateway = wss

  server.on('upgrade', (req, socket, head) => {
    // The socket is ours from here on, an unhandled 'error' would kill the process.
    socket.on('error', () => {})

    const [path, query = ''] = (req.url ?? '').split('?')
    if (path !== TERMINAL_WS_PATH) {
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n')
      return
    }

    const origin = req.headers.origin
    const ticket = new URLSearchParams(query).get('ticket') ?? ''
    const payload = origin && env.CLIENT_ORIGINS.includes(origin) ? TicketService.consume(ticket) : undefined

    wss.handleUpgrade(req, socket, head, (ws) => {
      if (!payload) {
        ws.close(TerminalCloseCode.UNAUTHORIZED, 'Invalid ticket or origin')
        return
      }
      if (TerminalSession.countFor(payload.userId) >= env.MAX_SESSIONS_PER_USER) {
        ws.close(TerminalCloseCode.SESSION_LIMIT, 'Too many open sessions')
        return
      }
      void new TerminalSession(ws, payload.userId, payload.hostId, req.socket.remoteAddress ?? 'unknown').start()
    })
  })

  logger.info(`Terminal gateway attached at ${TERMINAL_WS_PATH}`)
}

export const closeTerminalGateway = async (): Promise<void> => {
  TerminalSession.closeAll()
  const wss = gateway
  gateway = undefined
  if (!wss) return
  await new Promise<void>((resolve) => wss.close(() => resolve()))
}
