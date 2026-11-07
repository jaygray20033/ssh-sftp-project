import { create } from 'zustand'
import type { Host } from '@lib/types'

// UI-only state. Server data lives in TanStack Query (see hooks.ts).
interface HostsUIState {
  search: string
  showModal: boolean
  editingHost: Host | null
  showDeleteDialog: boolean
  deletingHostId: string | null
  setSearch: (search: string) => void
  openCreateModal: () => void
  openEditModal: (host: Host) => void
  closeModal: () => void
  openDeleteDialog: (id: string) => void
  closeDeleteDialog: () => void
}

export const useHostsStore = create<HostsUIState>((set) => ({
  search: '',
  showModal: false,
  editingHost: null,
  showDeleteDialog: false,
  deletingHostId: null,
  setSearch: (search) => set({ search }),
  openCreateModal: () => set({ showModal: true, editingHost: null }),
  openEditModal: (host) => set({ showModal: true, editingHost: host }),
  closeModal: () => set({ showModal: false, editingHost: null }),
  openDeleteDialog: (id) => set({ showDeleteDialog: true, deletingHostId: id }),
  closeDeleteDialog: () => set({ showDeleteDialog: false, deletingHostId: null })
}))
