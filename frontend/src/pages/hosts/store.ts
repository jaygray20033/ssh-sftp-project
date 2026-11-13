import { create } from 'zustand'
import type { Host, TestHostResult } from '@lib/types'

// UI-only state. Server data lives in TanStack Query (see hooks.ts).
interface HostsUIState {
  search: string
  // Active tag filter; null = show all.
  tag: string | null
  showModal: boolean
  editingHost: Host | null
  showDeleteDialog: boolean
  deletingHostId: string | null
  // Result of the last "Kiểm tra" click; the trust dialog shows it.
  testResult: { hostId: string; result: TestHostResult } | null
  setSearch: (search: string) => void
  setTag: (tag: string | null) => void
  openCreateModal: () => void
  openEditModal: (host: Host) => void
  closeModal: () => void
  openDeleteDialog: (id: string) => void
  closeDeleteDialog: () => void
  setTestResult: (hostId: string, result: TestHostResult) => void
  closeTestResult: () => void
}

export const useHostsStore = create<HostsUIState>((set) => ({
  search: '',
  tag: null,
  showModal: false,
  editingHost: null,
  showDeleteDialog: false,
  deletingHostId: null,
  testResult: null,
  setSearch: (search) => set({ search }),
  setTag: (tag) => set({ tag }),
  openCreateModal: () => set({ showModal: true, editingHost: null }),
  openEditModal: (host) => set({ showModal: true, editingHost: host }),
  closeModal: () => set({ showModal: false, editingHost: null }),
  openDeleteDialog: (id) => set({ showDeleteDialog: true, deletingHostId: id }),
  closeDeleteDialog: () => set({ showDeleteDialog: false, deletingHostId: null }),
  setTestResult: (hostId, result) => set({ testResult: { hostId, result } }),
  closeTestResult: () => set({ testResult: null })
}))
