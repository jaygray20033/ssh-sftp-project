import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { otpSchema, type OtpInput as OtpFormInput } from '@lib/schemas/auth'
import { AuthCard, ErrorBanner, OtpInput, SubmitButton, BackLink, AuthDivider } from '../components'

interface Props {
  error: string
  onNext: (otp: string) => void
}

export function OtpStep({ error, onNext }: Props) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<OtpFormInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' }
  })

  const otp = watch('otp')
  const isComplete = otp.length === 6

  return (
    <>
      <div className='text-center mb-6'>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>
          Nhập mã xác nhận
        </h1>
        <p className='text-sm mt-1.5' style={{ color: 'var(--color-muted)' }}>
          Mã 6 chữ số đã được gửi vào email của bạn
        </p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit((data) => onNext(data.otp))}>
          <ErrorBanner message={error || errors.otp?.message || ''} />
          {(error || errors.otp) && <div className='mb-4' />}

          <Controller
            name='otp'
            control={control}
            render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} />}
          />

          <SubmitButton loading={false} disabled={!isComplete}>
            Tiếp tục
          </SubmitButton>
        </form>

        <AuthDivider />
        <BackLink to='/forgot-password'>Gửi lại email</BackLink>
      </AuthCard>
    </>
  )
}
