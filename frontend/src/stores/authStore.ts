import { create } from 'zustand'
import { type AuthUser, type AuthResponse, authService, usersService, setAccessToken } from '../lib/api'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  pendingToken: string | null
  pendingEmail: string | null
  pendingPassword: string | null
  isAuthenticated: boolean
  initialized: boolean

  setAuth: (data: AuthResponse) => void
  setUser: (user: AuthUser) => void
  setPending2FA: (token: string, email?: string, password?: string) => void
  logout: () => Promise<void>
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  pendingToken: null,
  pendingEmail: null,
  pendingPassword: null,
  isAuthenticated: false,
  initialized: false,

  setAuth: (data: AuthResponse) => {
    setAccessToken(data.accessToken)
    localStorage.setItem('hasSession', '1')
    set({
      user: data.user,
      accessToken: data.accessToken,
      pendingToken: null,
      pendingEmail: null,
      pendingPassword: null,
      isAuthenticated: true
    })
  },

  setUser: (user: AuthUser) => set({ user }),

  setPending2FA: (token: string, email?: string, password?: string) => {
    set({ pendingToken: token, pendingEmail: email ?? null, pendingPassword: password ?? null })
  },

  logout: async () => {
    await authService.logout().catch(() => {})
    setAccessToken(null)
    localStorage.removeItem('hasSession')
    set({
      user: null,
      accessToken: null,
      pendingToken: null,
      pendingEmail: null,
      pendingPassword: null,
      isAuthenticated: false
    })
  },

  initAuth: async () => {
    if (!localStorage.getItem('hasSession')) {
      set({ initialized: true })
      return
    }
    try {
      const { accessToken } = await authService.refreshToken()
      setAccessToken(accessToken)
      const user = await usersService.getMe()
      set({ user, accessToken, isAuthenticated: true, initialized: true })
    } catch {
      setAccessToken(null)
      localStorage.removeItem('hasSession')
      set({ user: null, accessToken: null, isAuthenticated: false, initialized: true })
    }
  }
}))
