import { FolderOpen, Loader2, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Host } from '@lib/types'

interface HostChooserProps {
  hosts: Host[]
  search: string
  isLoading: boolean
  isError: boolean
  onSearch: (value: string) => void
  onOpen: (hostId: string) => void
}

export function HostChooser({ hosts, search, isLoading, isError, onSearch, onOpen }: HostChooserProps) {
  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Search
          size={16}
          className='absolute left-4 top-1/2 -translate-y-1/2'
          style={{ color: 'var(--color-muted)' }}
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder='Tìm host theo tên hoặc hostname...'
          aria-label='Tìm host'
          className='w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none'
          style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
        />
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center gap-2 py-24'>
          <Loader2 size={16} className='animate-spin' />
          <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
            Đang tải...
          </span>
        </div>
      ) : isError ? (
        <p className='text-sm font-medium text-center py-16' style={{ color: 'var(--color-down)' }}>
          Không tải được danh sách host.
        </p>
      ) : hosts.length === 0 ? (
        <div
          className='rounded-3xl p-8 flex flex-col items-center gap-4 min-h-64 text-center'
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
            <FolderOpen size={22} />
          </div>
          <p className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
            Không có host nào
          </p>
          <p className='text-sm max-w-xs' style={{ color: 'var(--color-muted)' }}>
            Thêm máy chủ SSH trong trang Hosts rồi quay lại đây để mở thư mục từ xa.
          </p>
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2'>
          {hosts.map((host) => (
            <button
              key={host.id}
              onClick={() => onOpen(host.id)}
              className='text-left rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition-all duration-150'
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                boxShadow: 'var(--clay-shadow-sm)'
              }}
            >
              <div
                className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                <FolderOpen size={18} />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-bold truncate' style={{ color: 'var(--color-text)' }}>
                    {host.name}
                  </span>
                  {host.hostKeyFingerprint ? (
                    <ShieldCheck size={14} style={{ color: 'var(--color-up)' }} aria-label='Host key đã tin tưởng' />
                  ) : (
                    <ShieldAlert
                      size={14}
                      style={{ color: 'var(--color-warning)' }}
                      aria-label='Chưa tin tưởng host key'
                    />
                  )}
                </div>
                <p className='text-xs mt-1 truncate font-mono' style={{ color: 'var(--color-muted)' }}>
                  {host.username}@{host.hostname}:{host.port}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
