import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hostsService } from '@lib/services/hosts.service'

const LEAVE_MESSAGE = 'Còn phiên terminal đang mở. Rời trang sẽ đóng tất cả phiên.'

// The page owns the WebSocket connections, so any navigation away closes them.
export function useLeaveGuard(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a')
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      if (!href.startsWith('/') || href.startsWith('/terminal')) return

      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [isEnabled])
}

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
