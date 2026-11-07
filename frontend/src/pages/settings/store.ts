import { create } from 'zustand'
import type { TwoFactorSetup } from '@lib/types'

interface SettingsUIState {
  activeTab: 'profile' | 'security'
  setActiveTab: (tab: 'profile' | 'security') => void
  twoFASetup: TwoFactorSetup | null
  setTwoFASetup: (setup: TwoFactorSetup | null) => void
}

export const useSettingsStore = create<SettingsUIState>((set) => ({
  activeTab: 'profile',
  setActiveTab: (tab) => set({ activeTab: tab }),
  twoFASetup: null,
  setTwoFASetup: (setup) => set({ twoFASetup: setup })
}))
