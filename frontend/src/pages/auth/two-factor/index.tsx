import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { useNavigate, Navigate } from 'react-router-dom'
import { otpSchema, type OtpInput as OtpFormValues } from '@lib/schemas/auth'
import { useAuthStore } from '@stores/authStore'
import { useTwoFactorStore } from './store'
import { AuthLogo, AuthCard, ErrorBanner, OtpInput, SubmitButton, BackLink, AuthDivider } from '../components'

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const pendingToken = useAuthStore((s) => s.pendingToken)
  const { loading, error, submit } = useTwoFactorStore()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' }
  })

  const otp = watch('otp')
  const isComplete = otp.length === 6

  if (!pendingToken) return <Navigate to='/login' replace />

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      <div
        className='clay-blob blob-float w-64 h-64 -top-10 -left-10'
        style={{ background: 'rgba(167,139,250,0.28)' }}
      />
      <div
        className='clay-blob blob-float-delay w-56 h-56 -bottom-16 -right-12'
        style={{ background: 'rgba(249,115,22,0.20)' }}
      />

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <AuthLogo />

          <div className='flex justify-center mb-3'>
            <div
              className='w-16 h-16 rounded-2xl flex items-center justify-center'
              style={{
                background: 'var(--color-primary-light)',
                border: '2px solid rgba(124,58,237,0.2)',
                boxShadow: '0 8px 24px rgba(124,58,237,0.15)'
              }}
            >
              <ShieldCheck className='w-8 h-8' style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
            </div>
          </div>

          <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
            Xác thực 2 bước
          </h1>
          <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
            Nhập mã 6 chữ số từ ứng dụng xác thực
          </p>
        </div>

        <AuthCard>
          <form onSubmit={handleSubmit((data) => submit(data.otp, navigate))}>
            <ErrorBanner message={error || errors.otp?.message || ''} />
            {(error || errors.otp) && <div className='mb-4' />}

            <Controller
              name='otp'
              control={control}
              render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} />}
            />

            <SubmitButton loading={loading} disabled={!isComplete} loadingText='Đang xác thực...'>
              Xác nhận mã
            </SubmitButton>
          </form>

          <AuthDivider />
          <BackLink to='/login'>Quay lại đăng nhập</BackLink>
        </AuthCard>

        <p className='text-center text-xs mt-5 font-medium' style={{ color: 'var(--color-muted)' }}>
          Dùng Google Authenticator, Authy, hoặc ứng dụng tương tự
        </p>
      </div>
    </div>
  )
}
