import { create } from 'zustand'
import { authService, ApiError, type AuthResponse } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import type { LoginInput } from '@lib/schemas/auth'

interface LoginState {
  loading: boolean
  error: string

  setError: (error: string) => void
  submit: (data: LoginInput, navigate: (path: string) => void) => Promise<void>
  loginWithGoogle: () => Promise<void>
  reset: () => void
}

export const useLoginStore = create<LoginState>((set) => ({
  loading: false,
  error: '',

  setError: (error) => set({ error }),

  submit: async (data, navigate) => {
    set({ error: '', loading: true })
    try {
      const res = await authService.loginPassword({ email: data.email, password: data.password })
      if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
        useAuthStore.getState().setPending2FA(res.pendingToken, data.email, data.password)
        navigate('/2fa')
      } else {
        useAuthStore.getState().setAuth(res as AuthResponse)
        navigate('/dashboard')
      }
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Đăng nhập thất bại' })
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
