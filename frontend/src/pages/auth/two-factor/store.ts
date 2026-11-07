import { create } from 'zustand'
import { authService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'

interface TwoFactorState {
  loading: boolean
  error: string

  submit: (otp: string, navigate: (path: string) => void) => Promise<void>
  reset: () => void
}

export const useTwoFactorStore = create<TwoFactorState>((set) => ({
  loading: false,
  error: '',

  submit: async (otp, navigate) => {
    const { pendingToken, pendingEmail, pendingPassword } = useAuthStore.getState()
    if (!pendingToken) {
      set({ error: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' })
      return
    }
    set({ error: '', loading: true })
    try {
      // Google flow: no email/password → use /auth/2fa/verify
      // Password flow: email+password present → use /auth/login with all fields
      const res =
        pendingEmail && pendingPassword
          ? await authService.login2FA({ pendingToken, code: otp, email: pendingEmail, password: pendingPassword })
          : await authService.verifyGoogle2FA(pendingToken, otp)
      useAuthStore.getState().setAuth({ ...res, user: { ...res.user, isTwoFactorEnabled: true } })
      navigate('/dashboard')
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Mã xác thực không hợp lệ' })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ loading: false, error: '' })
}))
