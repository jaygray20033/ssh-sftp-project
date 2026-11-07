import { create } from 'zustand'
import { authService, ApiError } from '@lib/api'

interface VerifyEmailState {
  loading: boolean
  error: string
  verified: boolean

  submit: (otp: string) => Promise<void>
  reset: () => void
}

export const useVerifyEmailStore = create<VerifyEmailState>((set) => ({
  loading: false,
  error: '',
  verified: false,

  submit: async (otp) => {
    set({ error: '', loading: true })
    try {
      await authService.verifyEmail({ token: otp })
      set({ verified: true })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Xác thực thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '', verified: false })
}))
