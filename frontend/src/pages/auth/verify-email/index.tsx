import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Check } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { otpSchema, type OtpInput as OtpFormValues } from '@lib/schemas/auth'
import { useVerifyEmailStore } from './store'
import { AuthLogo, AuthCard, ErrorBanner, OtpInput, SubmitButton, AuthDivider, StatusBar } from '../components'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, error, verified, submit } = useVerifyEmailStore()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' }
  })

  const otp = watch('otp')
  const isComplete = otp.length === 6

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token || token.length < 6) return
    const digits = token.slice(0, 6).replace(/\D/g, '')
    if (digits.length === 6) setValue('otp', digits)
  }, [searchParams, setValue])

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      <div
        className='clay-blob blob-float-slow w-72 h-72 -top-16 -right-16'
        style={{ background: 'rgba(167,139,250,0.28)' }}
      />
      <div
        className='clay-blob blob-float w-60 h-60 -bottom-14 -left-14'
        style={{ background: 'rgba(236,72,153,0.20)' }}
      />

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <AuthLogo />
        </div>

        {!verified ? (
          <>
            <div className='text-center mb-6'>
              <div className='flex justify-center mb-4'>
                <div
                  className='w-16 h-16 rounded-2xl flex items-center justify-center'
                  style={{
                    background: 'var(--color-primary-light)',
                    border: '2px solid rgba(124,58,237,0.2)',
                    boxShadow: '0 8px 24px rgba(124,58,237,0.15)'
                  }}
                >
                  <Mail className='w-8 h-8' style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
                </div>
              </div>
              <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
                Xác thực email
              </h1>
              <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
                Nhập mã 6 chữ số được gửi đến email của bạn
              </p>
            </div>

            <AuthCard>
              <form onSubmit={handleSubmit((data) => submit(data.otp))}>
                <ErrorBanner message={error || errors.otp?.message || ''} />
                {(error || errors.otp) && <div className='mb-4' />}

                <Controller
                  name='otp'
                  control={control}
                  render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} />}
                />

                <SubmitButton loading={loading} disabled={!isComplete} loadingText='Đang xác thực...'>
                  Xác thực email
                </SubmitButton>
              </form>

              <AuthDivider />
              <p className='text-center text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
                Không nhận được email?{' '}
                <Link
                  to='/login'
                  className='font-bold transition-colors'
                  style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                >
                  Liên hệ hỗ trợ
                </Link>
              </p>
            </AuthCard>
          </>
        ) : (
          <>
            <div className='text-center mb-6'>
              <div className='flex justify-center mb-4'>
                <div
                  className='w-16 h-16 rounded-2xl flex items-center justify-center'
                  style={{
                    background: 'var(--color-primary-light)',
                    border: '2px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.2)'
                  }}
                >
                  <Check className='w-8 h-8' style={{ color: 'var(--color-up)' }} strokeWidth={2.5} />
                </div>
              </div>
              <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
                Email đã xác thực!
              </h1>
              <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
                Tài khoản của bạn đã được kích hoạt thành công
              </p>
            </div>

            <AuthCard>
              <button
                type='button'
                onClick={() => navigate('/login')}
                className='w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer'
                style={{
                  background: 'var(--cta)',
                  color: '#FFFFFF',
                  boxShadow: 'var(--clay-shadow-btn)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--cta-dark)'
                  e.currentTarget.style.boxShadow = 'var(--clay-shadow-btn-hover)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--cta)'
                  e.currentTarget.style.boxShadow = 'var(--clay-shadow-btn)'
                  e.currentTarget.style.transform = 'translateY(0px)'
                }}
              >
                Đăng nhập ngay
              </button>
            </AuthCard>

            <StatusBar />
          </>
        )}
      </div>
    </div>
  )
}
