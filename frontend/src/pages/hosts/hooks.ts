import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hostsService } from '@lib/services/hosts.service'
import type { CreateHostRequest, TestHostResult, UpdateHostRequest } from '@lib/types'
import { useHostsStore } from './store'

export function useHosts() {
  const qc = useQueryClient()
  const ui = useHostsStore()
  const search = ui.search.trim()

  const query = useQuery({
    queryKey: ['hosts', search, ui.tag],
    queryFn: () => hostsService.getHosts({ search: search || undefined, tag: ui.tag ?? undefined })
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

  // "Kiểm tra": POST /hosts/:id/test. A failed test is still HTTP 200 with ok:false;
  // when it carries a fingerprint we show the "Tin tưởng host này?" dialog.
  const testMutation = useMutation({
    mutationFn: (id: string) => hostsService.testHost(id),
    onSuccess: (result: TestHostResult, hostId: string) => {
      ui.setTestResult(hostId, result)
      qc.invalidateQueries({ queryKey: ['hosts'] })
    },
    onError: () => toast.error('Không kiểm tra được host')
  })

  // Trusting a key: store the fingerprint, then re-test to confirm it now works.
  const trustMutation = useMutation({
    mutationFn: ({ id, fingerprint }: { id: string; fingerprint: string }) =>
      hostsService.trustHostKey(id, fingerprint),
    onSuccess: async (_, { id }) => {
      toast.success('Đã tin tưởng host key')
      ui.closeTestResult()
      qc.invalidateQueries({ queryKey: ['hosts'] })
      // Confirm right away that a real connection now succeeds.
      try {
        const result = await hostsService.testHost(id)
        ui.setTestResult(id, result)
      } catch {
        // The trust step already succeeded; a failed re-test shows in the list status.
      }
    },
    onError: () => toast.error('Không lưu được host key')
  })

  return {
    hosts: query.data?.entries ?? [],
    // Unique tags of the loaded hosts, for the filter chips.
    tags: [...new Set((query.data?.entries ?? []).flatMap((h) => h.tags))].sort(),
    total: query.data?.total_count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTesting: testMutation.isPending,
    isTrusting: trustMutation.isPending,
    testingHostId: testMutation.variables,
    ...ui,
    submitHost: (data: CreateHostRequest | UpdateHostRequest) => saveMutation.mutate({ id: ui.editingHost?.id, data }),
    confirmDelete: () => {
      if (ui.deletingHostId) deleteMutation.mutate(ui.deletingHostId)
    },
    runTest: (id: string) => testMutation.mutate(id),
    confirmTrust: (id: string, fingerprint: string) => trustMutation.mutate({ id, fingerprint })
  }
}
