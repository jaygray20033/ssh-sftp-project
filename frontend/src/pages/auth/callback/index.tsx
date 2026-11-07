import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService, ApiError, type AuthResponse } from '@lib/api'
import { useAuthStore } from '@stores/authStore'
import { AuthLogo } from '../components'

function Spinner() {
  return (
    <div
      className='w-12 h-12 rounded-full border-4 animate-spin'
      style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
    />
  )
}

export default function CallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth, setPending2FA } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const called = useRef(false)

  useEffect(() => {
    // Strict mode guard — chỉ gọi 1 lần
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setError('Thiếu thông tin xác thực từ Google. Vui lòng thử lại.')
      return
    }

    authService
      .googleCallback({ code, state })
      .then((res) => {
        if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
          setPending2FA(res.pendingToken)
          navigate('/2fa', { replace: true })
        } else {
          setAuth(res as AuthResponse)
          navigate('/dashboard', { replace: true })
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Đăng nhập bằng Google thất bại.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      <div
        className='clay-blob blob-float w-80 h-80 -top-20 -left-20'
        style={{ background: 'rgba(167,139,250,0.35)' }}
      />
      <div
        className='clay-blob blob-float-delay w-64 h-64 top-1/3 -right-16'
        style={{ background: 'rgba(249,115,22,0.22)' }}
      />
      <div
        className='clay-blob blob-float-slow w-96 h-96 -bottom-32 left-1/4'
        style={{ background: 'rgba(236,72,153,0.20)' }}
      />

      <div className='clay-card p-10 flex flex-col items-center gap-6 w-full max-w-sm relative z-10 text-center'>
        <AuthLogo />

        {error ? (
          <>
            <div
              className='w-14 h-14 rounded-full flex items-center justify-center text-2xl'
              style={{ background: 'rgba(239,68,68,0.12)' }}
            >
              ✕
            </div>
            <div>
              <p className='font-bold text-lg mb-1' style={{ color: 'var(--color-text)' }}>
                Đăng nhập thất bại
              </p>
              <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
                {error}
              </p>
            </div>
            <Link
              to='/login'
              className='w-full py-3 rounded-2xl font-bold text-sm text-center transition-opacity hover:opacity-80'
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <>
            <Spinner />
            <div>
              <p className='font-bold text-lg mb-1' style={{ color: 'var(--color-text)' }}>
                Đang xác thực...
              </p>
              <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
                Vui lòng chờ trong giây lát
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
