import crypto from 'node:crypto'

import NodeCache from 'node-cache'

import { TERMINAL_TICKET_BYTES, TERMINAL_TICKET_TTL_SECONDS } from '@common/constants'

export type TerminalTicket = {
  userId: string
  hostId: string
}

const tickets = new NodeCache({ stdTTL: TERMINAL_TICKET_TTL_SECONDS, checkperiod: 5, useClones: false })

class TicketService {
  static issue(userId: string, hostId: string): string {
    const ticket = crypto.randomBytes(TERMINAL_TICKET_BYTES).toString('hex')
    tickets.set(ticket, { userId, hostId } satisfies TerminalTicket)
    return ticket
  }

  // Single use: the ticket is deleted as soon as it is read.
  static consume(ticket: string): TerminalTicket | undefined {
    const payload = tickets.get<TerminalTicket>(ticket)
    if (!payload) return undefined
    tickets.del(ticket)
    return payload
  }
}

export default TicketService
