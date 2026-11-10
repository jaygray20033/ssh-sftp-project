import { http } from '../axios'
import type { PaginatedSessionLogs } from '../types'

export async function getSessions(params: { limit?: number; offset?: number } = {}) {
  const { data } = await http.get<{ sessions: PaginatedSessionLogs }>('/sessions', { params })
  return data.sessions
}

export const sessionsService = { getSessions }
