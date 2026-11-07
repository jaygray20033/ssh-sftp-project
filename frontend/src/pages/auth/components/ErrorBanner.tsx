import { XCircle } from 'lucide-react'

interface Props {
  message: string
}

export function ErrorBanner({ message }: Props) {
  if (!message) return null
  return (
    <div
      className='p-3.5 rounded-2xl text-sm font-medium flex items-start gap-2.5'
      style={{
        background: 'rgba(239,68,68,0.07)',
        border: '2px solid rgba(239,68,68,0.18)',
        color: '#B91C1C'
      }}
    >
      <XCircle size={16} className='shrink-0 mt-0.5' />
      {message}
    </div>
  )
}
