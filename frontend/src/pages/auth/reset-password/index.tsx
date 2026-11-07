import { AuthLogo } from '../components'
import { useResetPasswordStore } from './store'
import { OtpStep } from './OtpStep'
import { PasswordStep } from './PasswordStep'
import { DoneStep } from './DoneStep'

type Step = 'otp' | 'password' | 'done'
const STEPS: Step[] = ['otp', 'password', 'done']

export default function ResetPasswordPage() {
  const { step, loading, error, nextStep, submitPassword } = useResetPasswordStore()

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      <div
        className='clay-blob blob-float-delay w-64 h-64 -top-10 -right-10'
        style={{ background: 'rgba(167,139,250,0.28)' }}
      />
      <div
        className='clay-blob blob-float-slow w-72 h-72 -bottom-20 -left-16'
        style={{ background: 'rgba(249,115,22,0.20)' }}
      />

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <AuthLogo />
          <ProgressBar steps={STEPS} current={step} />
        </div>

        {step === 'otp' && <OtpStep error={error} onNext={nextStep} />}
        {step === 'password' && <PasswordStep loading={loading} error={error} onSubmit={submitPassword} />}
        {step === 'done' && <DoneStep />}
      </div>
    </div>
  )
}

function ProgressBar({ steps, current }: { steps: Step[]; current: Step }) {
  return (
    <div className='flex items-center justify-center gap-2 mb-4'>
      {steps.map((s, i) => (
        <div key={s} className='flex items-center gap-2'>
          <div
            className='w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300'
            style={{
              background:
                current === s ? 'var(--cta)' : i < steps.indexOf(current) ? 'rgba(124,58,237,0.15)' : '#E5E7EB',
              color: current === s ? '#FFFFFF' : i < steps.indexOf(current) ? 'var(--color-primary)' : '#9CA3AF',
              boxShadow: current === s ? '0 4px 12px rgba(124,58,237,0.4)' : 'none'
            }}
          >
            {i < steps.indexOf(current) ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className='w-8 h-0.5 rounded-full'
              style={{
                background: i < steps.indexOf(current) ? 'var(--cta)' : '#E5E7EB'
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
