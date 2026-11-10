import { create } from 'zustand'

interface DashboardUIState {
  showQuickConnect: boolean
  openQuickConnect: () => void
  closeQuickConnect: () => void
}

export const useDashboardStore = create<DashboardUIState>((set) => ({
  showQuickConnect: false,
  openQuickConnect: () => set({ showQuickConnect: true }),
  closeQuickConnect: () => set({ showQuickConnect: false })
}))
