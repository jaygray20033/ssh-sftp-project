import type { SessionLog } from '@entities/session-log.entity'

/** The only shape of a session log that may leave the API. */
export function toSessionLogResponse(log: SessionLog) {
  return {
    id: log.id,
    hostId: log.hostId,
    hostLabel: log.hostLabel,
    startedAt: log.startedAt,
    endedAt: log.endedAt,
    clientIp: log.clientIp,
    closeReason: log.closeReason
  }
}

export type SessionLogResponse = ReturnType<typeof toSessionLogResponse>
