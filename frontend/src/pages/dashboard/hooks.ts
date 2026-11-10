import { useQuery } from '@tanstack/react-query'
import type { Host } from '@lib/types'
import { hostsService } from '@lib/services/hosts.service'
import { sessionsService } from '@lib/services/sessions.service'

const timeValue = (iso: string | null) => (iso ? new Date(iso).getTime() : 0)

// Most recently used hosts first, never-connected ones last.
const byRecentUse = (a: Host, b: Host) =>
  timeValue(b.lastConnectedAt) - timeValue(a.lastConnectedAt) || timeValue(b.updatedAt) - timeValue(a.updatedAt)

export function useDashboardHosts() {
  const query = useQuery({
    queryKey: ['hosts', 'dashboard'],
    queryFn: () => hostsService.getHosts({ limit: 100 })
  })

  const hosts = query.data?.entries ?? []
  const trusted = hosts.filter((h) => h.hostKeyFingerprint).length

  return {
    hosts,
    total: query.data?.total_count ?? hosts.length,
    trusted,
    untrusted: hosts.length - trusted,
    recent: [...hosts].sort(byRecentUse).slice(0, 5),
    isLoading: query.isLoading,
    isError: query.isError
  }
}

export function useDashboardSessions() {
  const query = useQuery({
    queryKey: ['sessions', 'dashboard'],
    queryFn: () => sessionsService.getSessions({ limit: 5 }),
    retry: false
  })

  const entries = query.data?.entries ?? []

  return {
    sessions: entries,
    total: query.data?.total_count ?? entries.length,
    isLoading: query.isLoading,
    isError: query.isError
  }
}
