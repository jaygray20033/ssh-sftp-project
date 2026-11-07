import { AuthLogo } from '../components'
import { useForgotPasswordStore } from './store'
import { FormStep } from './FormStep'
import { SentStep } from './SentStep'

export default function ForgotPasswordPage() {
  const { step, email, loading, error, submit, resend } = useForgotPasswordStore()

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      <div
        className='clay-blob blob-float w-64 h-64 -top-12 -left-12'
        style={{ background: 'rgba(167,139,250,0.30)' }}
      />
      <div
        className='clay-blob blob-float-slow w-72 h-72 -bottom-20 -right-16'
        style={{ background: 'rgba(236,72,153,0.22)' }}
      />

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <AuthLogo href='/login' />
        </div>

        {step === 'form' ? (
          <FormStep loading={loading} error={error} onSubmit={submit} />
        ) : (
          <SentStep email={email} loading={loading} onResend={resend} />
        )}
      </div>
    </div>
  )
}
