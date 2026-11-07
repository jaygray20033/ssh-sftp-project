import { Plus, Search, Server, Loader2 } from 'lucide-react'
import { useHosts } from './hooks'
import { HostCard } from './components/HostCard'
import { HostModal } from './components/HostModal'
import { DeleteDialog } from './components/DeleteDialog'

export default function HostsPage() {
  const { hosts, total, isLoading, isError, search, setSearch, openCreateModal } = useHosts()

  return (
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
              Hosts
            </h1>
            <p className='text-sm mt-0.5 font-medium' style={{ color: 'var(--color-muted)' }}>
              Các máy chủ SSH của bạn ({total})
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200 btn-primary'
            style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
          >
            <Plus size={16} />
            Thêm host
          </button>
        </div>

        <div className='relative'>
          <Search
            size={16}
            className='absolute left-4 top-1/2 -translate-y-1/2'
            style={{ color: 'var(--color-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Tìm theo tên hoặc hostname...'
            className='w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none'
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
          />
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-24'>
            <Loader2 size={16} className='animate-spin' />
            <span className='ml-2 text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
              Đang tải...
            </span>
          </div>
        ) : isError ? (
          <p className='text-sm font-medium text-center py-16' style={{ color: 'var(--color-down)' }}>
            Không tải được danh sách host. Hãy thử lại sau.
          </p>
        ) : hosts.length === 0 ? (
          <div
            className='rounded-3xl p-8 flex flex-col items-center justify-center gap-4 min-h-64 text-center'
            style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--clay-shadow-md)'
            }}
          >
            <div
              className='w-16 h-16 rounded-2xl flex items-center justify-center'
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Server size={20} />
            </div>
            <div>
              <p className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
                {search ? 'Không có host phù hợp' : 'Chưa có host nào'}
              </p>
              {!search && (
                <p className='text-sm mt-1 max-w-xs' style={{ color: 'var(--color-muted)' }}>
                  Thêm máy chủ SSH đầu tiên để bắt đầu kết nối ngay trong trình duyệt.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {hosts.map((h) => (
              <HostCard key={h.id} host={h} />
            ))}
          </div>
        )}
      </div>

      <HostModal />
      <DeleteDialog />
    </>
  )
}
