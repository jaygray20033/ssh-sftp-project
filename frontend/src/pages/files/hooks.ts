import { useQuery } from '@tanstack/react-query'
import { hostsService } from '@lib/services/hosts.service'

export function useFileHosts() {
  const query = useQuery({
    queryKey: ['hosts', 'files'],
    queryFn: () => hostsService.getHosts({ limit: 100 })
  })

  return { hosts: query.data?.entries ?? [], isLoading: query.isLoading, isError: query.isError }
}

export function useFileHost(hostId: string) {
  const query = useQuery({
    queryKey: ['hosts', 'by-id', hostId],
    queryFn: () => hostsService.getHost(hostId),
    enabled: Boolean(hostId)
  })

  return { host: query.data ?? null, isLoading: query.isLoading, isError: query.isError }
}
