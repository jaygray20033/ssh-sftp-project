import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

function Spinner() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div
        className='w-10 h-10 rounded-full border-4 animate-spin'
        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()

  if (!initialized) return <Spinner />
  if (isAuthenticated) return <Navigate to='/dashboard' replace />
  return <>{children}</>
}
