import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  loading: boolean
  disabled?: boolean
  loadingText?: string
  children: ReactNode
  type?: 'submit' | 'button'
  onClick?: () => void
}

export function SubmitButton({
  loading,
  disabled,
  loadingText = 'Đang xử lý...',
  children,
  type = 'submit',
  onClick
}: Props) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className='w-full btn-primary text-sm tracking-wide'
    >
      {loading ? (
        <span className='flex items-center justify-center gap-2'>
          <Loader2 size={16} className='animate-spin' />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
