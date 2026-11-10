import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hostsService } from '@lib/services/hosts.service'

export function useTerminalHosts() {
  const query = useQuery({
    queryKey: ['hosts', 'terminal'],
    queryFn: () => hostsService.getHosts({ limit: 100 })
  })

  return {
    hosts: query.data?.entries ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch
  }
}

export function useTestHost() {
  return useMutation({
    mutationFn: (hostId: string) => hostsService.testHost(hostId),
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Không kiểm tra được kết nối')
  })
}

export function useTrustHostKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ hostId, fingerprint }: { hostId: string; fingerprint: string }) =>
      hostsService.trustHostKey(hostId, fingerprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
      toast.success('Đã tin tưởng host key')
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Không thể lưu host key')
  })
}
