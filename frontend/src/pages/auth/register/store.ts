import { create } from 'zustand'
import { authService, ApiError } from '@lib/api'
import type { RegisterInput } from '@lib/schemas/auth'

interface RegisterState {
  loading: boolean
  error: string

  setError: (error: string) => void
  submit: (data: RegisterInput, navigate: (path: string) => void) => Promise<void>
  loginWithGoogle: () => Promise<void>
  reset: () => void
}

export const useRegisterStore = create<RegisterState>((set) => ({
  loading: false,
  error: '',

  setError: (error) => set({ error }),

  submit: async (data, navigate) => {
    set({ error: '', loading: true })
    try {
      await authService.register(data)
      navigate('/verify-email')
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đăng ký thất bại' })
    } finally {
      set({ loading: false })
    }
  },

  loginWithGoogle: async () => {
    try {
      const { url } = await authService.getGoogleAuthUrl()
      window.location.href = url
    } catch {
      set({ error: 'Không thể kết nối Google OAuth' })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
