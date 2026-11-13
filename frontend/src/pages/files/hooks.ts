import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hostsService } from '@lib/services/hosts.service'
import { sftpService } from '@lib/services/sftp.service'

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

// dir '' is the SSH home, same path style the SFTP API uses.
export function useSftpList(hostId: string, dir: string) {
  return useQuery({
    queryKey: ['sftp', hostId, dir],
    queryFn: () => sftpService.listDir(hostId, dir),
    retry: false
  })
}

/** mkdir / rename / delete, each refreshes the listing on success. */
export function useSftpActions(hostId: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['sftp', hostId] })

  const mkdir = useMutation({
    mutationFn: (path: string) => sftpService.makeDir(hostId, path),
    onSuccess: () => {
      refresh()
      toast.success('Đã tạo thư mục')
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Không tạo được thư mục')
  })

  const rename = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => sftpService.renameEntry(hostId, from, to),
    onSuccess: () => {
      refresh()
      toast.success('Đã đổi tên')
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Không đổi tên được')
  })

  const remove = useMutation({
    mutationFn: ({ path, recursive }: { path: string; recursive: boolean }) =>
      sftpService.removeEntry(hostId, path, recursive),
    onSuccess: () => {
      refresh()
      toast.success('Đã xoá')
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Không xoá được')
  })

  return { mkdir, rename, remove }
}
