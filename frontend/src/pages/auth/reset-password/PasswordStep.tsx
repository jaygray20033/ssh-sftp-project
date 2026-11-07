import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@lib/schemas/auth'
import { AuthCard, ErrorBanner, FieldInput, SubmitButton } from '../components'

interface Props {
  loading: boolean
  error: string
  onSubmit: (data: ResetPasswordInput) => Promise<void>
}

export function PasswordStep({ loading, error, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema)
  })

  return (
    <>
      <div className='text-center mb-6'>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>
          Tạo mật khẩu mới
        </h1>
        <p className='text-sm mt-1.5' style={{ color: 'var(--color-muted)' }}>
          Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt
        </p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <ErrorBanner message={error} />
          <FieldInput
            id='password'
            label='Mật khẩu mới'
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
          <SubmitButton loading={loading} loadingText='Đang lưu...'>
            Đặt lại mật khẩu
          </SubmitButton>
        </form>
      </AuthCard>
    </>
  )
}
