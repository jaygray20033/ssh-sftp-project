import { create } from 'zustand'
import { authService, ApiError } from '@lib/api'
import type { ResetPasswordInput } from '@lib/schemas/auth'

export type ResetPasswordStep = 'otp' | 'password' | 'done'

interface ResetPasswordState {
  step: ResetPasswordStep
  otpCode: string
  loading: boolean
  error: string

  nextStep: (otp: string) => void
  submitPassword: (data: ResetPasswordInput) => Promise<void>
  reset: () => void
}

export const useResetPasswordStore = create<ResetPasswordState>((set, get) => ({
  step: 'otp',
  otpCode: '',
  loading: false,
  error: '',

  nextStep: (otp) => {
    set({ error: '', step: 'password', otpCode: otp })
  },

  submitPassword: async (data) => {
    const { otpCode } = get()
    set({ error: '', loading: true })
    try {
      await authService.resetPassword({
        token: otpCode,
        password: data.password,
        confirmPassword: data.confirmPassword
      })
      set({ step: 'done' })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đặt lại mật khẩu thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ step: 'otp', otpCode: '', loading: false, error: '' })
}))
