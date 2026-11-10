import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  tone: string
}

export function StatCard({ icon: Icon, label, value, hint, tone }: StatCardProps) {
  return (
    <div
      className='rounded-2xl p-4 flex items-start gap-3'
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        boxShadow: 'var(--clay-shadow-sm)'
      }}
    >
      <div
        className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
        style={{ background: tone, color: 'var(--text)' }}
      >
        <Icon size={18} strokeWidth={2.4} />
      </div>
      <div className='min-w-0'>
        <p className='text-[10px] font-bold uppercase tracking-[0.14em]' style={{ color: 'var(--color-muted)' }}>
          {label}
        </p>
        <p className='text-2xl font-extrabold leading-none mt-1' style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
        <p className='text-xs mt-1 truncate' style={{ color: 'var(--color-muted)' }}>
          {hint}
        </p>
      </div>
    </div>
  )
}
