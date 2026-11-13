import { http } from '../axios'
import type { PaginatedSessionLogs } from '../types'

export async function getSessions(params: { limit?: number; offset?: number } = {}) {
  const { data } = await http.get<{ sessions: PaginatedSessionLogs }>('/sessions', { params })
  return data.sessions
}

/** Asciicast v2 file of a session (B11); 404 when nothing was recorded. */
export async function getRecording(id: string) {
  const { data } = await http.get<Blob>(`/sessions/${id}/recording`, { responseType: 'blob' })
  return data
}

export const sessionsService = { getSessions, getRecording }
