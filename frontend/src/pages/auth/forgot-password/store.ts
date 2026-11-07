import { create } from 'zustand'
import { authService, ApiError } from '@lib/api'
import type { ForgotPasswordInput } from '@lib/schemas/auth'

export type ForgotPasswordStep = 'form' | 'sent'

interface ForgotPasswordState {
  step: ForgotPasswordStep
  email: string
  loading: boolean
  error: string

  submit: (data: ForgotPasswordInput) => Promise<void>
  resend: () => Promise<void>
  reset: () => void
}

export const useForgotPasswordStore = create<ForgotPasswordState>((set, get) => ({
  step: 'form',
  email: '',
  loading: false,
  error: '',

  submit: async (data) => {
    set({ error: '', loading: true })
    try {
      await authService.forgotPassword({ email: data.email })
      set({ step: 'sent', email: data.email })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        set({ error: 'Tài khoản này đăng nhập bằng Google. Vui lòng dùng Google để đăng nhập.' })
      } else {
        set({ error: err instanceof ApiError ? err.message : 'Không thể gửi email' })
      }
    } finally {
      set({ loading: false })
    }
  },

  resend: async () => {
    const { email } = get()
    set({ loading: true })
    try {
      await authService.forgotPassword({ email })
    } catch {
      // intentionally ignored — resend silently fails
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ step: 'form', email: '', loading: false, error: '' })
}))
