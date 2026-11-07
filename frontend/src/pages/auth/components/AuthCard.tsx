import type { ReactNode } from 'react'

export function AuthCard({ children }: { children: ReactNode }) {
  return <div className='clay-card p-8 relative z-10'>{children}</div>
}
