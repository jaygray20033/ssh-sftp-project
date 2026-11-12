import env from '@common/config/env'
import { SESSION_LOG_CLOSE_REASON_MAX_LENGTH } from '@common/constants'
import { Paginated } from '@common/types'

import { ListSessionsQuery } from './dto'
import { SessionLogResponse, toSessionLogResponse } from './session-log.mapper'
import SessionLogRepository from './session-log.repository'

class SessionLogService {
  /** Called once when a terminal session is actually opened. */
  static async open(input: { userId: string; hostId: string; hostLabel: string; clientIp: string }) {
    return SessionLogRepository.create({
      ...input,
      startedAt: new Date()
    })
  }

  /** Called on every close, including errors and timeouts. */
  static async close(logId: string, closeReason: string): Promise<void> {
    await SessionLogRepository.close(logId, new Date(), closeReason.slice(0, SESSION_LOG_CLOSE_REASON_MAX_LENGTH))
  }

  static async getSessions(userId: string, query: ListSessionsQuery): Promise<Paginated<SessionLogResponse>> {
    const [logs, total_count] = await SessionLogRepository.listByUserId(userId, query.limit, query.offset)
    return { entries: logs.map(toSessionLogResponse), limit: query.limit, offset: query.offset, total_count }
  }

  /** Retention job: delete logs older than the configured number of days. */
  static async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - env.SESSION_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    const result = await SessionLogRepository.deleteStartedBefore(cutoff)
    return result.affected ?? 0
  }
}

export default SessionLogService
