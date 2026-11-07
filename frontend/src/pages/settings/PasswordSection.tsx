import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form'
import { usePasswordMutation } from './hooks'
import { changePasswordSchema, type ChangePasswordInput } from '@lib/schemas/auth'
import { SectionCard, SaveButton, ModalOverlay, ModalCloseBtn } from './components'

interface PasswordInputProps {
  id: string
  label: string
  placeholder?: string
  error?: FieldError
  registration: UseFormRegisterReturn
}

function PasswordInput({ id, label, placeholder, error, registration }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label htmlFor={id} className='block text-sm font-semibold mb-1.5' style={{ color: 'var(--color-text-2)' }}>
        {label}
      </label>
      <div className='relative'>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          {...registration}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-down)' : 'var(--color-primary)'
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 4px rgba(239,68,68,0.12)'
              : '0 0 0 4px rgba(124,58,237,0.12)'
            e.currentTarget.style.background = '#FFFFFF'
          }}
          onBlur={(e) => {
            registration.onBlur(e)
            e.currentTarget.style.borderColor = error ? 'var(--color-down)' : 'rgba(124,58,237,0.15)'
            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.background = 'var(--color-surface-2)'
          }}
          className='w-full pl-4 pr-11 py-3 rounded-2xl text-sm font-medium outline-none transition-all duration-200 placeholder:text-gray-400'
          style={{
            background: 'var(--color-surface-2)',
            border: `2px solid ${error ? 'var(--color-down)' : 'rgba(124,58,237,0.15)'}`,
            color: 'var(--color-text)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
          }}
        />
        <button
          type='button'
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity duration-150 hover:opacity-70'
          style={{ color: 'var(--color-muted)' }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p className='mt-1.5 text-xs font-medium flex items-center gap-1' style={{ color: 'var(--color-down)' }}>
          <AlertCircle size={14} />
          {error.message}
        </p>
      )}
    </div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const mutation = usePasswordMutation()
  const errorMsg = mutation.error instanceof Error ? mutation.error.message : ''

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) })

  const onSubmit = (data: ChangePasswordInput) => {
    mutation.mutate(data, {
      onSuccess: () => {
        reset()
        onClose()
      }
    })
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className='clay-card w-full max-w-md p-7 space-y-5' style={{ boxShadow: 'var(--clay-shadow-lg)' }}>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-extrabold text-base' style={{ color: 'var(--color-text)' }}>
              Đổi mật khẩu
            </h3>
            <p className='text-xs mt-0.5' style={{ color: 'var(--color-muted)' }}>
              Nhập mật khẩu hiện tại để xác nhận
            </p>
          </div>
          <ModalCloseBtn onClose={onClose} />
        </div>

        {errorMsg && (
          <div
            className='px-4 py-3 rounded-2xl text-sm font-medium'
            style={{
              background: 'rgba(239,68,68,0.07)',
              border: '2px solid rgba(239,68,68,0.18)',
              color: '#B91C1C'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <PasswordInput
            id='currentPassword'
            label='Mật khẩu hiện tại'
            placeholder='••••••••'
            error={errors.currentPassword}
            registration={register('currentPassword')}
          />
          <PasswordInput
            id='newPassword'
            label='Mật khẩu mới'
            placeholder='••••••••'
            error={errors.newPassword}
            registration={register('newPassword')}
          />
          <PasswordInput
            id='confirmPassword'
            label='Xác nhận mật khẩu mới'
            placeholder='••••••••'
            error={errors.confirmPassword}
            registration={register('confirmPassword')}
          />
          <div className='flex gap-3 pt-1'>
            <SaveButton loading={mutation.isPending} text='Đổi mật khẩu' />
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 btn-secondary'
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

export function PasswordSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} />}

      <SectionCard title='Đổi mật khẩu'>
        <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
          Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className='px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 cursor-pointer'
          style={{
            background: 'var(--cta)',
            boxShadow: 'var(--clay-shadow-btn)'
          }}
        >
          Đổi mật khẩu
        </button>
      </SectionCard>
    </>
  )
}
