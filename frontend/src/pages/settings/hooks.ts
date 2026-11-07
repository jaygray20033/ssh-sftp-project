import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authService, usersService, ApiError } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import { useSettingsStore } from './store'
import type { UpdateProfileInput, ChangePasswordInput } from '@lib/schemas/auth'

function toMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export function useProfileMutation() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      usersService.updateMe({ fullName: data.fullName, username: data.username || undefined }),
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Cập nhật hồ sơ thành công!')
    },
    onError: (err: unknown) => toast.error(toMsg(err, 'Cập nhật thất bại'))
  })
}

export function usePasswordMutation() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) => usersService.changePassword(data),
    onSuccess: () => toast.success('Đổi mật khẩu thành công!'),
    onError: (err: unknown) => toast.error(toMsg(err, 'Đổi mật khẩu thất bại'))
  })
}

export function useSetup2FAMutation() {
  const setTwoFASetup = useSettingsStore((s) => s.setTwoFASetup)
  return useMutation({
    mutationFn: () => authService.setup2FA(),
    onSuccess: (setup) => setTwoFASetup(setup),
    onError: (err: unknown) => toast.error(toMsg(err, 'Không thể khởi tạo 2FA'))
  })
}

export function useConfirm2FAMutation() {
  const twoFASetup = useSettingsStore((s) => s.twoFASetup)
  const setTwoFASetup = useSettingsStore((s) => s.setTwoFASetup)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (code: string) => {
      if (!twoFASetup) throw new Error('No setup token')
      return authService.confirm2FA({ code, setUpToken: twoFASetup.setUpToken })
    },
    onSuccess: () => {
      setTwoFASetup(null)
      if (user) setUser({ ...user, isTwoFactorEnabled: true })
      toast.success('Xác thực 2 yếu tố đã được kích hoạt!')
    },
    onError: (err: unknown) => toast.error(toMsg(err, 'Mã không hợp lệ'))
  })
}

export function useDisable2FAMutation() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (code: string) => authService.disable2FA({ code }),
    onSuccess: () => {
      if (user) setUser({ ...user, isTwoFactorEnabled: false })
      toast.success('Đã tắt xác thực 2 yếu tố.')
    },
    onError: (err: unknown) => toast.error(toMsg(err, 'Không thể tắt 2FA'))
  })
}

export function useDeleteAccountMutation() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => usersService.deleteAccount(),
    onSuccess: () => logout(),
    onError: (err: unknown) => toast.error(toMsg(err, 'Không thể xóa tài khoản'))
  })
}
