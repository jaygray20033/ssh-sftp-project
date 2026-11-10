import { create } from 'zustand'

interface TerminalUIState {
  selectedHostId: string | null
  search: string
  setSelectedHostId: (id: string | null) => void
  setSearch: (search: string) => void
}

export const useTerminalStore = create<TerminalUIState>((set) => ({
  selectedHostId: null,
  search: '',
  setSelectedHostId: (selectedHostId) => set({ selectedHostId }),
  setSearch: (search) => set({ search })
}))
