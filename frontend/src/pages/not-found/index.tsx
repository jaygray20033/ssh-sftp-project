import { SearchX, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

export default function NotFoundPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      {/* Background blobs */}
      <div
        className='clay-blob blob-float w-80 h-80 -top-20 -left-20'
        style={{ background: 'rgba(167,139,250,0.3)' }}
      />
      <div
        className='clay-blob blob-float-delay w-64 h-64 top-1/3 -right-16'
        style={{ background: 'rgba(249,115,22,0.2)' }}
      />
      <div
        className='clay-blob blob-float-slow w-72 h-72 -bottom-24 left-1/4'
        style={{ background: 'rgba(236,72,153,0.18)' }}
      />

      <div className='relative z-10 text-center space-y-6 max-w-md'>
        {/* 404 number */}
        <div className='relative inline-block'>
          <span
            className='text-[8rem] font-extrabold leading-none select-none'
            style={{
              background: 'var(--cta)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 8px 24px rgba(124,58,237,0.25))'
            }}
          >
            404
          </span>
        </div>

        <div className='clay-card px-8 py-8 space-y-4'>
          <div
            className='w-14 h-14 rounded-2xl flex items-center justify-center mx-auto'
            style={{ background: 'var(--color-primary-light)' }}
          >
            <SearchX size={26} stroke='var(--color-primary)' strokeWidth={2} />
          </div>

          <div>
            <h1 className='text-xl font-extrabold' style={{ color: 'var(--color-text)' }}>
              Trang không tồn tại
            </h1>
            <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
              Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
          </div>

          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className='inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150'
            style={{
              background: 'var(--cta)',
              boxShadow: 'var(--clay-shadow-btn)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--clay-shadow-btn-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--clay-shadow-btn)')}
          >
            <ChevronLeft size={16} />
            {isAuthenticated ? 'Về Dashboard' : 'Về trang đăng nhập'}
          </Link>
        </div>
      </div>
    </div>
  )
}
