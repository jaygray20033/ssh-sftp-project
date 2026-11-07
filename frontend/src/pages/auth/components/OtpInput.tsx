import { useRef } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'

const LENGTH = 6

interface Props {
  value: string
  onChange: (otp: string) => void
}

export function OtpInput({ value, onChange }: Props) {
  const digits = Array(LENGTH)
    .fill('')
    .map((_, i) => (value[i] && /^\d$/.test(value[i]) ? value[i] : ''))

  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const focusNext = (i: number) => inputs.current[i + 1]?.focus()
  const focusPrev = (i: number) => inputs.current[i - 1]?.focus()

  const handleChange = (index: number, inputValue: string) => {
    if (!/^\d*$/.test(inputValue)) return
    const next = [...digits]
    next[index] = inputValue.slice(-1)
    onChange(next.join(''))
    if (inputValue) focusNext(index)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]) focusPrev(index)
    if (e.key === 'ArrowLeft') focusPrev(index)
    if (e.key === 'ArrowRight') focusNext(index)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const pasted = text.replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return
    const next = Array(LENGTH).fill('')
    pasted.split('').forEach((d, i) => {
      next[i] = d
    })
    onChange(next.join(''))
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
  }

  return (
    <div>
      <div className='flex gap-2.5 justify-center mb-4'>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className='text-center text-xl font-bold rounded-2xl outline-none transition-all duration-150 cursor-text'
            style={{
              width: 46,
              height: 54,
              background: digit ? 'rgba(124,58,237,0.07)' : 'var(--color-surface-2)',
              border: digit ? '2px solid rgba(124,58,237,0.5)' : '2px solid rgba(124,58,237,0.15)',
              color: digit ? 'var(--color-primary)' : 'var(--color-text)',
              boxShadow: digit ? '0 4px 12px rgba(124,58,237,0.15)' : 'inset 0 2px 4px rgba(0,0,0,0.04)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = digit ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.15)'
              e.currentTarget.style.boxShadow = digit
                ? '0 4px 12px rgba(124,58,237,0.15)'
                : 'inset 0 2px 4px rgba(0,0,0,0.04)'
            }}
          />
        ))}
      </div>

      <div className='flex justify-center gap-1.5 mb-5'>
        {digits.map((d, i) => (
          <span
            key={i}
            className='w-1.5 h-1.5 rounded-full transition-all duration-200'
            style={{ background: d ? 'var(--color-primary)' : '#E5E7EB' }}
          />
        ))}
      </div>
    </div>
  )
}
