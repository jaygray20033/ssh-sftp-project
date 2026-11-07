import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  to: string
  children: ReactNode
}

export function BackLink({ to, children }: Props) {
  return (
    <p className='text-center text-sm'>
      <Link
        to={to}
        className='inline-flex items-center gap-1.5 font-semibold transition-all duration-150 cursor-pointer'
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
      >
        <ArrowLeft size={16} />
        {children}
      </Link>
    </p>
  )
}
