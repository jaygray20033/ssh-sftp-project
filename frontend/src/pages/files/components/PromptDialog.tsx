import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface PromptDialogProps {
  title: string
  label: string
  hint?: string
  initialValue?: string
  confirmLabel: string
  busy: boolean
  onConfirm: (value: string) => void
  onClose: () => void
}

/** One dialog covers "new folder" and "rename": ask for a single name. */
export function PromptDialog({
  title,
  label,
  hint,
  initialValue,
  confirmLabel,
  busy,
  onConfirm,
  onClose
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    const name = value.trim()
    if (!name) return
    // A name with a slash would move the entry; "." and ".." make no sense here.
    if (name.includes('/') || name === '.' || name === '..') {
      setError('Tên không được chứa / và không được là . hoặc ..')
      return
    }
    onConfirm(name)
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className='w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-lg)'
        }}
      >
        <h2 className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className='flex flex-col gap-1.5'
        >
          <label className='text-xs font-bold uppercase tracking-wider' style={{ color: 'var(--color-muted)' }}>
            {label}
          </label>
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            spellCheck={false}
            className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
            style={{
              background: 'var(--color-bg)',
              border: `1.5px solid ${error ? 'var(--color-down)' : 'var(--color-border)'}`,
              color: 'var(--color-text)'
            }}
          />
          {error && (
            <span className='text-xs' style={{ color: 'var(--color-down)' }}>
              {error}
            </span>
          )}
          {hint && !error && (
            <span className='text-xs' style={{ color: 'var(--color-muted)' }}>
              {hint}
            </span>
          )}

          <div className='flex gap-3 pt-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer'
              style={{
                background: 'var(--color-bg)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-muted)'
              }}
            >
              Huỷ
            </button>
            <button
              type='submit'
              disabled={busy || !value.trim() || value.trim() === (initialValue ?? '')}
              className='flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60'
              style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
            >
              {busy && <Loader2 size={16} className='animate-spin' />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
