import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuthStore } from '@stores/authStore'
import { useSettingsStore } from './store'
import { useSetup2FAMutation, useConfirm2FAMutation, useDisable2FAMutation } from './hooks'
import { otpSchema, type OtpInput as OtpFormValues } from '@lib/schemas/auth'
import { OtpInput } from '../auth/components'
import { SectionCard, ModalOverlay, ModalCloseBtn } from './components'

function extractTotpSecret(otpauthUrl: string): string {
  try {
    const params = new URLSearchParams(otpauthUrl.split('?')[1])
    return params.get('secret') ?? otpauthUrl
  } catch {
    return otpauthUrl
  }
}

function StepDots({ step }: { step: 'qr' | 'otp' }) {
  return (
    <div className='flex items-center justify-center gap-2'>
      {(['qr', 'otp'] as const).map((s) => (
        <div
          key={s}
          className='h-1.5 rounded-full transition-all duration-300'
          style={{
            width: step === s ? 24 : 8,
            background: step === s ? 'var(--color-primary)' : 'var(--color-border-2)'
          }}
        />
      ))}
    </div>
  )
}

function Setup2FAModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'qr' | 'otp'>('qr')
  const twoFASetup = useSettingsStore((s) => s.twoFASetup)
  const setTwoFASetup = useSettingsStore((s) => s.setTwoFASetup)
  const setup2FA = useSetup2FAMutation()
  const confirm2FA = useConfirm2FAMutation()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema), defaultValues: { otp: '' } })

  useEffect(() => {
    setup2FA.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setTwoFASetup(null)
    setup2FA.reset()
    confirm2FA.reset()
    reset()
    onClose()
  }

  const onConfirm = ({ otp }: OtpFormValues) => {
    confirm2FA.mutate(otp, {
      onSuccess: () => {
        reset()
        onClose()
      }
    })
  }

  const setupErrorMsg = setup2FA.error instanceof Error ? setup2FA.error.message : ''
  const confirmErrorMsg = confirm2FA.error instanceof Error ? confirm2FA.error.message : ''

  return (
    <ModalOverlay onClose={handleClose}>
      <div className='clay-card w-full max-w-md p-7 space-y-5' style={{ boxShadow: 'var(--clay-shadow-lg)' }}>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-extrabold text-base' style={{ color: 'var(--color-text)' }}>
              Thiết lập xác thực 2 yếu tố
            </h3>
            <p className='text-xs mt-0.5' style={{ color: 'var(--color-muted)' }}>
              {step === 'qr' ? 'Bước 1 — Quét mã QR' : 'Bước 2 — Xác nhận mã'}
            </p>
          </div>
          <ModalCloseBtn onClose={handleClose} />
        </div>

        <StepDots step={step} />

        {step === 'qr' && (
          <div className='space-y-4'>
            {setupErrorMsg && (
              <div
                className='px-4 py-3 rounded-2xl text-sm font-medium'
                style={{
                  background: 'rgba(239,68,68,0.07)',
                  border: '2px solid rgba(239,68,68,0.18)',
                  color: '#B91C1C'
                }}
              >
                {setupErrorMsg}
              </div>
            )}
            {setup2FA.isPending || !twoFASetup ? (
              <div className='flex flex-col items-center gap-3 py-8'>
                <div
                  className='w-10 h-10 rounded-full border-4 animate-spin'
                  style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                />
                <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
                  Đang tạo mã QR...
                </p>
              </div>
            ) : (
              <>
                <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
                  Mở <strong style={{ color: 'var(--color-text)' }}>Google Authenticator</strong>, Authy hoặc app tương
                  tự rồi quét mã bên dưới:
                </p>
                <div className='flex justify-center'>
                  <div className='p-3 rounded-2xl' style={{ background: '#fff', boxShadow: 'var(--clay-shadow-sm)' }}>
                    <QRCodeSVG value={twoFASetup.otpauthUrl} size={176} level='M' marginSize={1} />
                  </div>
                </div>
                <div>
                  <p className='text-xs mb-1.5' style={{ color: 'var(--color-muted)' }}>
                    Không quét được? Nhập thủ công mã bí mật:
                  </p>
                  <div
                    className='px-3 py-2.5 rounded-xl font-mono text-xs break-all select-all cursor-text'
                    style={{
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      border: '1.5px solid rgba(124,58,237,0.2)'
                    }}
                  >
                    {extractTotpSecret(twoFASetup.otpauthUrl)}
                  </div>
                </div>
                <div className='flex gap-3 pt-1'>
                  <button
                    onClick={() => setStep('otp')}
                    className='flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all'
                    style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
                  >
                    Tiếp theo →
                  </button>
                  <button
                    onClick={handleClose}
                    className='flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer'
                    style={{ color: 'var(--color-muted)', border: '1.5px solid var(--color-border-2)' }}
                  >
                    Hủy
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'otp' && (
          <form onSubmit={handleSubmit(onConfirm)} className='space-y-4'>
            {confirmErrorMsg && (
              <div
                className='px-4 py-3 rounded-2xl text-sm font-medium'
                style={{
                  background: 'rgba(239,68,68,0.07)',
                  border: '2px solid rgba(239,68,68,0.18)',
                  color: '#B91C1C'
                }}
              >
                {confirmErrorMsg}
              </div>
            )}
            <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
              Nhập mã 6 chữ số từ app xác thực để hoàn tất kích hoạt:
            </p>
            <Controller
              name='otp'
              control={control}
              render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} />}
            />
            {errors.otp && (
              <p className='text-xs' style={{ color: 'var(--color-down)' }}>
                {errors.otp.message}
              </p>
            )}
            <div className='flex gap-3 pt-1'>
              <button
                type='submit'
                disabled={confirm2FA.isPending}
                className='flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60 transition-all'
                style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
              >
                {confirm2FA.isPending ? 'Đang kích hoạt...' : 'Xác nhận & kích hoạt'}
              </button>
              <button
                type='button'
                onClick={() => setStep('qr')}
                className='px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer'
                style={{ color: 'var(--color-muted)', border: '1.5px solid var(--color-border-2)' }}
              >
                ← Quay lại
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalOverlay>
  )
}

function Disable2FAModal({ onClose }: { onClose: () => void }) {
  const mutation = useDisable2FAMutation()
  const errorMsg = mutation.error instanceof Error ? mutation.error.message : ''

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema), defaultValues: { otp: '' } })

  const onSubmit = ({ otp }: OtpFormValues) => {
    mutation.mutate(otp, {
      onSuccess: () => {
        reset()
        onClose()
      }
    })
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className='clay-card w-full max-w-sm p-7 space-y-5' style={{ boxShadow: 'var(--clay-shadow-lg)' }}>
        <div className='flex items-start justify-between gap-3'>
          <div
            className='w-11 h-11 rounded-2xl flex items-center justify-center shrink-0'
            style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.2)' }}
          >
            <TriangleAlert className='w-5 h-5' style={{ color: 'var(--color-down)' }} strokeWidth={2} />
          </div>
          <div className='flex-1'>
            <h3 className='font-extrabold text-base' style={{ color: 'var(--color-text)' }}>
              Tắt xác thực 2 yếu tố
            </h3>
            <p className='text-xs mt-0.5' style={{ color: 'var(--color-muted)' }}>
              Nhập mã từ app xác thực để xác nhận
            </p>
          </div>
          <ModalCloseBtn onClose={onClose} />
        </div>

        {errorMsg && (
          <div
            className='px-4 py-3 rounded-2xl text-sm font-medium'
            style={{ background: 'rgba(239,68,68,0.07)', border: '2px solid rgba(239,68,68,0.18)', color: '#B91C1C' }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <p className='text-xs font-semibold' style={{ color: 'var(--color-text-2)' }}>
            Mã xác thực (6 chữ số)
          </p>
          <Controller
            name='otp'
            control={control}
            render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} />}
          />
          {errors.otp && (
            <p className='text-xs' style={{ color: 'var(--color-down)' }}>
              {errors.otp.message}
            </p>
          )}
          <div className='flex gap-3 pt-1'>
            <button
              type='submit'
              disabled={mutation.isPending}
              className='flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60 transition-all'
              style={{ background: 'var(--color-down)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
            >
              {mutation.isPending ? 'Đang xử lý...' : 'Xác nhận tắt'}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer'
              style={{ color: 'var(--color-muted)', border: '1.5px solid var(--color-border-2)' }}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export function TwoFASection() {
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const isTwoFAEnabled = useAuthStore((s) => s.user?.isTwoFactorEnabled ?? false)
  const setTwoFASetup = useSettingsStore((s) => s.setTwoFASetup)

  return (
    <>
      {showSetupModal && <Setup2FAModal onClose={() => setShowSetupModal(false)} />}
      {showDisableModal && <Disable2FAModal onClose={() => setShowDisableModal(false)} />}

      <SectionCard title='Xác thực 2 yếu tố (2FA)'>
        <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
          Tăng cường bảo mật bằng cách yêu cầu mã xác thực khi đăng nhập.
        </p>

        {isTwoFAEnabled ? (
          <div className='flex items-center gap-3'>
            <div
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold'
              style={{
                background: 'rgba(16,185,129,0.1)',
                color: 'var(--color-up)',
                border: '1px solid rgba(16,185,129,0.2)'
              }}
            >
              <span className='w-1.5 h-1.5 rounded-full bg-current' />
              Đang bật
            </div>
            <button
              onClick={() => setShowDisableModal(true)}
              className='px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer'
              style={{
                color: 'var(--color-down)',
                border: '1.5px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.06)'
              }}
            >
              Tắt 2FA
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTwoFASetup(null)
              setShowSetupModal(true)
            }}
            className='px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 cursor-pointer'
            style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
          >
            Thiết lập 2FA
          </button>
        )}
      </SectionCard>
    </>
  )
}
