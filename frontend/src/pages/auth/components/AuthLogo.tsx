import { SquareTerminal } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  href?: string
}

export function AuthLogo({ href }: Props) {
  const content = (
    <>
      <div
        className='w-10 h-10 rounded-2xl flex items-center justify-center'
        style={{
          background: 'var(--cta)',
          border: '2px solid var(--text)',
          boxShadow: '3px 3px 0 var(--text)'
        }}
      >
        <SquareTerminal className='w-5 h-5 text-white' strokeWidth={2.5} />
      </div>
      <span className='text-xl font-extrabold' style={{ color: 'var(--color-text)' }}>
        Shell<span style={{ color: 'var(--color-primary)' }}>Deck</span>
      </span>
    </>
  )

  if (href) {
    return (
      <Link to={href} className='inline-flex items-center gap-2.5 mb-4 cursor-pointer'>
        {content}
      </Link>
    )
  }

  return <div className='inline-flex items-center gap-2.5 mb-4'>{content}</div>
}
