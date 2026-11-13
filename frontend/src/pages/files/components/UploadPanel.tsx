import { Check, Loader2, X } from 'lucide-react'

export interface UploadItem {
  id: string
  name: string
  percent: number
  state: 'busy' | 'done' | 'error'
  error?: string
}

// Shows every upload started in this visit; stays visible until the page reloads.
export function UploadPanel({ items }: { items: UploadItem[] }) {
  if (items.length === 0) return null

  return (
    <div
      className='rounded-2xl p-4 flex flex-col gap-3'
      style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
    >
      <p className='text-xs font-bold uppercase tracking-wider' style={{ color: 'var(--color-muted)' }}>
        Đang tải lên
      </p>

      {items.map((item) => (
        <div key={item.id} className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 text-xs'>
            {item.state === 'busy' && <Loader2 size={13} className='animate-spin shrink-0' />}
            {item.state === 'done' && <Check size={13} className='shrink-0' style={{ color: 'var(--color-up)' }} />}
            {item.state === 'error' && <X size={13} className='shrink-0' style={{ color: 'var(--color-down)' }} />}
            <span className='font-bold truncate' style={{ color: 'var(--color-text)' }} title={item.name}>
              {item.name}
            </span>
            <span className='ml-auto shrink-0 font-mono' style={{ color: 'var(--color-muted)' }}>
              {item.state === 'error' ? 'Lỗi' : `${item.percent}%`}
            </span>
          </div>
          <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'var(--color-bg)' }}>
            <div
              className='h-full rounded-full transition-all'
              style={{
                width: `${item.percent}%`,
                background: item.state === 'error' ? 'var(--color-down)' : 'var(--color-primary)'
              }}
            />
          </div>
          {item.error && (
            <span className='text-[11px]' style={{ color: 'var(--color-down)' }}>
              {item.error}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
