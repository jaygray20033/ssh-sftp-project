import { afterEach, describe, expect, it, vi } from 'vitest'

import env from '@common/config/env'

import type { SessionLog } from '@entities/session-log.entity'

import SessionLogRepository from './session-log.repository'
import SessionLogService from './session-log.service'

vi.mock('./session-log.repository', () => ({
  default: { create: vi.fn(), close: vi.fn(), listByUserId: vi.fn(), deleteStartedBefore: vi.fn() }
}))

const makeLog = (overrides: Partial<SessionLog> = {}) =>
  ({
    id: 'log-1',
    userId: 'user-1',
    hostId: 'host-1',
    hostLabel: 'srv',
    startedAt: new Date('2026-01-01T10:00:00Z'),
    endedAt: null,
    clientIp: '203.0.113.5',
    closeReason: null,
    ...overrides
  }) as SessionLog

describe('SessionLogService', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('records when a session opens', async () => {
    vi.mocked(SessionLogRepository.create).mockImplementation((data) => Promise.resolve(makeLog(data)))
    await SessionLogService.open({ userId: 'user-1', hostId: 'host-1', hostLabel: 'srv', clientIp: '203.0.113.5' })
    expect(SessionLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', hostId: 'host-1', hostLabel: 'srv', clientIp: '203.0.113.5' })
    )
    const arg = vi.mocked(SessionLogRepository.create).mock.calls[0][0]
    expect(arg.startedAt!).toBeInstanceOf(Date)
  })

  it('records when a session closes, with the close reason', async () => {
    await SessionLogService.close('log-1', 'Client disconnected')
    const [, endedAt, closeReason] = vi.mocked(SessionLogRepository.close).mock.calls[0]
    expect(endedAt.getTime()).toBeGreaterThan(0)
    expect(closeReason).toBe('Client disconnected')
  })

  it('truncates long close reasons', async () => {
    await SessionLogService.close('log-1', 'x'.repeat(500))
    expect(vi.mocked(SessionLogRepository.close).mock.calls[0][2].length).toBeLessThanOrEqual(100)
  })

  it('lists only the logs of the requesting user', async () => {
    const own = makeLog()
    vi.mocked(SessionLogRepository.listByUserId).mockResolvedValue([[own], 1])
    const page = await SessionLogService.getSessions('user-1', { limit: 20, offset: 0 })
    expect(SessionLogRepository.listByUserId).toHaveBeenCalledWith('user-1', 20, 0)
    expect(page.entries[0]).toMatchObject({ id: 'log-1', hostLabel: 'srv', clientIp: '203.0.113.5' })
    expect(page).toMatchObject({ limit: 20, offset: 0, total_count: 1 })
  })

  it('purges logs older than the retention window', async () => {
    vi.mocked(SessionLogRepository.deleteStartedBefore).mockResolvedValue({ affected: 3, raw: [] })
    const deleted = await SessionLogService.purgeExpired()
    expect(deleted).toBe(3)
    const cutoff = vi.mocked(SessionLogRepository.deleteStartedBefore).mock.calls[0][0]
    const expectedDays = env.SESSION_LOG_RETENTION_DAYS
    const diffDays = (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000)
    expect(diffDays).toBeGreaterThanOrEqual(expectedDays - 0.01)
    expect(diffDays).toBeLessThan(expectedDays + 0.01)
  })
})
