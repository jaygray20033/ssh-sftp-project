import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { registerSchema, type RegisterInput } from '@lib/schemas/auth'
import { useRegisterStore } from './store'
import { AuthLogo, AuthCard, ErrorBanner, FieldInput, SubmitButton, GoogleButton, AuthDivider } from '../components'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { loading, error, submit, loginWithGoogle } = useRegisterStore()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden'>
      <div
        className='clay-blob blob-float w-72 h-72 -top-16 -right-16'
        style={{ background: 'rgba(167,139,250,0.32)' }}
      />
      <div
        className='clay-blob blob-float-delay w-64 h-64 top-1/2 -left-20'
        style={{ background: 'rgba(236,72,153,0.22)' }}
      />
      <div
        className='clay-blob blob-float-slow w-80 h-80 -bottom-24 right-1/4'
        style={{ background: 'rgba(249,115,22,0.18)' }}
      />

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <AuthLogo />
          <h1 className='text-3xl font-extrabold' style={{ color: 'var(--color-text)' }}>
            Tạo tài khoản
          </h1>
          <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
            SSH và SFTP mã nguồn mở ngay trong trình duyệt
          </p>
        </div>

        <AuthCard>
          <GoogleButton onClick={loginWithGoogle}>Đăng ký với Google</GoogleButton>
          <AuthDivider text='hoặc' />

          <form onSubmit={handleSubmit((data) => submit(data, navigate))} className='space-y-4'>
            <ErrorBanner message={error} />

            <div className='grid grid-cols-2 gap-3'>
              <FieldInput
                id='fullName'
                label='Họ và tên'
                type='text'
                placeholder='Kim Nguyen'
                error={errors.fullName}
                registration={register('fullName')}
              />
              <FieldInput
                id='username'
                label='Tên đăng nhập'
                type='text'
                placeholder='kimnguen'
                error={errors.username}
                registration={register('username')}
              />
            </div>

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
              label='Mật khẩu'
              type='password'
              placeholder='Tối thiểu 8 ký tự'
              error={errors.password}
              registration={register('password')}
            />
            <FieldInput
              id='confirmPassword'
              label='Xác nhận mật khẩu'
              type='password'
              placeholder='••••••••'
              error={errors.confirmPassword}
              registration={register('confirmPassword')}
            />

            <SubmitButton loading={loading} loadingText='Đang tạo tài khoản...'>
              Tạo tài khoản
            </SubmitButton>
          </form>

          <p className='text-center text-sm mt-6 font-medium' style={{ color: 'var(--color-muted)' }}>
            Đã có tài khoản?{' '}
            <Link
              to='/login'
              className='font-bold transition-colors'
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            >
              Đăng nhập
            </Link>
          </p>
        </AuthCard>

        <p className='text-center text-xs mt-5 font-medium' style={{ color: 'var(--color-muted)' }}>
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <a href='#' className='underline underline-offset-2' style={{ color: 'var(--color-primary)' }}>
            Điều khoản dịch vụ
          </a>{' '}
          và{' '}
          <a href='#' className='underline underline-offset-2' style={{ color: 'var(--color-primary)' }}>
            Chính sách bảo mật
          </a>
        </p>
      </div>
    </div>
  )
}
