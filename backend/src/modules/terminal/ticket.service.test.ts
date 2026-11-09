import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TicketService from './ticket.service'

describe('TicketService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('issues a 32 byte hex ticket bound to the user and the host', () => {
    const ticket = TicketService.issue('user-1', 'host-1')
    expect(ticket).toMatch(/^[0-9a-f]{64}$/)
    expect(TicketService.consume(ticket)).toEqual({ userId: 'user-1', hostId: 'host-1' })
  })

  it('issues a different ticket every time', () => {
    expect(TicketService.issue('user-1', 'host-1')).not.toBe(TicketService.issue('user-1', 'host-1'))
  })

  it('is still valid just before the 30 second TTL', () => {
    const ticket = TicketService.issue('user-1', 'host-1')
    vi.advanceTimersByTime(29_000)
    expect(TicketService.consume(ticket)).toEqual({ userId: 'user-1', hostId: 'host-1' })
  })

  it('expires after 30 seconds', () => {
    const ticket = TicketService.issue('user-1', 'host-1')
    vi.advanceTimersByTime(31_000)
    expect(TicketService.consume(ticket)).toBeUndefined()
  })

  it('cannot be used twice', () => {
    const ticket = TicketService.issue('user-1', 'host-1')
    expect(TicketService.consume(ticket)).toBeDefined()
    expect(TicketService.consume(ticket)).toBeUndefined()
  })

  it('rejects a ticket that was never issued', () => {
    expect(TicketService.consume('f'.repeat(64))).toBeUndefined()
    expect(TicketService.consume('')).toBeUndefined()
  })

  it('keeps the ticket bound to the user it was issued to', () => {
    const first = TicketService.issue('user-1', 'host-1')
    const second = TicketService.issue('user-2', 'host-2')

    expect(TicketService.consume(first)).toEqual({ userId: 'user-1', hostId: 'host-1' })
    expect(TicketService.consume(second)).toEqual({ userId: 'user-2', hostId: 'host-2' })
  })
})
