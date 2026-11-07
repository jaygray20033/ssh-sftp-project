import { AlertCircle } from 'lucide-react'
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form'
import type { ReactNode } from 'react'

interface Props {
  id: string
  label: ReactNode
  type?: string
  placeholder?: string
  error?: FieldError
  registration: UseFormRegisterReturn
}

export function FieldInput({ id, label, type = 'text', placeholder, error, registration }: Props) {
  return (
    <div>
      <label htmlFor={id} className='block text-sm font-semibold mb-1.5' style={{ color: 'var(--color-text-2)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...registration}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-down)' : 'var(--color-primary)'
          e.currentTarget.style.boxShadow = error ? '0 0 0 4px rgba(239,68,68,0.12)' : '0 0 0 4px rgba(124,58,237,0.12)'
          e.currentTarget.style.background = '#FFFFFF'
        }}
        onBlur={(e) => {
          registration.onBlur(e)
          e.currentTarget.style.borderColor = error ? 'var(--color-down)' : 'rgba(124,58,237,0.15)'
          e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)'
          e.currentTarget.style.background = 'var(--color-surface-2)'
        }}
        className='w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all duration-200 placeholder:text-gray-400'
        style={{
          background: 'var(--color-surface-2)',
          border: `2px solid ${error ? 'var(--color-down)' : 'rgba(124,58,237,0.15)'}`,
          color: 'var(--color-text)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
        }}
      />
      {error && (
        <p className='mt-1.5 text-xs font-medium flex items-center gap-1' style={{ color: 'var(--color-down)' }}>
          <AlertCircle size={14} />
          {error.message}
        </p>
      )}
    </div>
  )
}
