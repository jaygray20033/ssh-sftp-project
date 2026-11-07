import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hostsService } from '@lib/services/hosts.service'
import type { CreateHostRequest, UpdateHostRequest } from '@lib/types'
import { useHostsStore } from './store'

export function useHosts() {
  const qc = useQueryClient()
  const ui = useHostsStore()
  const search = ui.search.trim()

  const query = useQuery({
    queryKey: ['hosts', search],
    queryFn: () => hostsService.getHosts({ search: search || undefined })
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CreateHostRequest | UpdateHostRequest }) =>
      id ? hostsService.updateHost(id, data as UpdateHostRequest) : hostsService.createHost(data as CreateHostRequest),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      toast.success(id ? 'Đã cập nhật host' : 'Đã thêm host mới')
      ui.closeModal()
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Đã xảy ra lỗi')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hostsService.deleteHost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      toast.success('Đã xoá host')
      ui.closeDeleteDialog()
    },
    onError: () => toast.error('Không thể xoá host')
  })

  return {
    hosts: query.data?.entries ?? [],
    total: query.data?.total_count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    ...ui,
    submitHost: (data: CreateHostRequest | UpdateHostRequest) => saveMutation.mutate({ id: ui.editingHost?.id, data }),
    confirmDelete: () => {
      if (ui.deletingHostId) deleteMutation.mutate(ui.deletingHostId)
    }
  }
}
