import { useNavigate } from 'react-router-dom'
import { Plus, Server, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'
import { useHosts } from '@pages/hosts/hooks'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { hosts, total, isLoading, openCreateModal } = useHosts()
  const preview = hosts.slice(0, 5)

  const addHost = () => {
    openCreateModal()
    navigate('/hosts')
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
            Xin chào, {user?.fullName?.split(' ').slice(-1)[0] ?? 'bạn'} 👋
          </h1>
          <p className='text-sm mt-0.5 font-medium' style={{ color: 'var(--color-muted)' }}>
            SSH và SFTP ngay trong trình duyệt
          </p>
        </div>
        <button
          onClick={addHost}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer btn-primary'
          style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
        >
          <Plus size={16} />
          Thêm host
        </button>
      </div>

      <div
        className='rounded-2xl px-5 py-4 flex flex-col gap-1 w-48'
        style={{ background: 'var(--color-primary-light)', border: '1.5px solid var(--color-border)' }}
      >
        <span className='text-xs font-semibold uppercase tracking-widest' style={{ color: 'var(--color-primary)' }}>
          Số host
        </span>
        <span className='text-3xl font-extrabold' style={{ color: 'var(--color-text)' }}>
          {total}
        </span>
      </div>

      <div
        className='rounded-3xl p-6 flex flex-col gap-4'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-md)'
        }}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-extrabold' style={{ color: 'var(--color-text)' }}>
            Hosts gần đây
          </h2>
          {total > 0 && (
            <button
              onClick={() => navigate('/hosts')}
              className='flex items-center gap-1.5 text-xs font-bold cursor-pointer'
              style={{ color: 'var(--color-primary)' }}
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className='py-10 flex items-center justify-center'>
            <Loader2 size={20} className='animate-spin' style={{ color: 'var(--color-muted)' }} />
          </div>
        ) : preview.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-10 text-center'>
            <div
              className='w-12 h-12 rounded-2xl flex items-center justify-center'
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Server size={20} />
            </div>
            <p className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
              Chưa có host nào
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {preview.map((h) => (
              <div
                key={h.id}
                className='flex items-center gap-3 px-4 py-3 rounded-xl'
                style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
              >
                <span className='flex-1 text-sm font-semibold truncate' style={{ color: 'var(--color-text)' }}>
                  {h.name}
                </span>
                <span className='text-xs font-mono truncate' style={{ color: 'var(--color-muted)' }}>
                  {h.username}@{h.hostname}:{h.port}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
