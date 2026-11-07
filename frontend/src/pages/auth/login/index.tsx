import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { loginSchema, type LoginInput } from '@lib/schemas/auth'
import { useLoginStore } from './store'
import {
  AuthLogo,
  AuthCard,
  ErrorBanner,
  FieldInput,
  SubmitButton,
  GoogleButton,
  AuthDivider,
  StatusBar
} from '../components'

export default function LoginPage() {
  const navigate = useNavigate()
  const { loading, error, submit, loginWithGoogle } = useLoginStore()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

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
      <div
        className='clay-blob blob-float w-48 h-48 bottom-10 right-10'
        style={{ background: 'rgba(16,185,129,0.18)' }}
      />

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <AuthLogo />
          <h1 className='text-3xl font-extrabold' style={{ color: 'var(--color-text)' }}>
            Chào mừng trở lại!
          </h1>
          <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
            Đăng nhập để quản lý SSH và SFTP của bạn
          </p>
        </div>

        <AuthCard>
          <GoogleButton onClick={loginWithGoogle}>Tiếp tục với Google</GoogleButton>
          <AuthDivider text='hoặc' />

          <form onSubmit={handleSubmit((data) => submit(data, navigate))} className='space-y-4'>
            <ErrorBanner message={error} />

            <FieldInput
              id='email'
              label='Email'
              type='email'
              placeholder='you@example.com'
              error={errors.email}
              registration={register('email')}
            />

            <FieldInput
              id='password'
              label={
                <span className='flex items-center justify-between'>
                  Mật khẩu
                  <Link
                    to='/forgot-password'
                    className='text-xs font-semibold transition-colors'
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                  >
                    Quên mật khẩu?
                  </Link>
                </span>
              }
              type='password'
              placeholder='••••••••'
              error={errors.password}
              registration={register('password')}
            />

            <SubmitButton loading={loading} loadingText='Đang đăng nhập...'>
              Đăng nhập
            </SubmitButton>
          </form>

          <p className='text-center text-sm mt-6 font-medium' style={{ color: 'var(--color-muted)' }}>
            Chưa có tài khoản?{' '}
            <Link
              to='/register'
              className='font-bold transition-colors'
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            >
              Đăng ký ngay
            </Link>
          </p>
        </AuthCard>

        <StatusBar />
      </div>
    </div>
  )
}
