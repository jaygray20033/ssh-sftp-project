import type { SessionLog } from '@entities/session-log.entity'

import RecordingService from './recording.service'

/** The only shape of a session log that may leave the API. */
export function toSessionLogResponse(log: SessionLog) {
  return {
    id: log.id,
    hostId: log.hostId,
    hostLabel: log.hostLabel,
    startedAt: log.startedAt,
    endedAt: log.endedAt,
    clientIp: log.clientIp,
    closeReason: log.closeReason,
    // Lets the UI show a "replay" button only when a recording exists.
    hasRecording: RecordingService.has(log.id)
  }
}

export type SessionLogResponse = ReturnType<typeof toSessionLogResponse>
