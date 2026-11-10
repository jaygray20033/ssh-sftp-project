import { Search, Server, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import type { Host } from '@lib/types'

interface HostPickerProps {
  hosts: Host[]
  selectedId: string | null
  search: string
  isLoading: boolean
  isError: boolean
  onSearch: (value: string) => void
  onSelect: (hostId: string) => void
}

export function HostPicker({ hosts, selectedId, search, isLoading, isError, onSearch, onSelect }: HostPickerProps) {
  return (
    <div
      className='rounded-2xl flex flex-col overflow-hidden'
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        boxShadow: 'var(--clay-shadow-sm)'
      }}
    >
      <div className='p-3' style={{ borderBottom: '1.5px solid var(--color-border)' }}>
        <div className='relative'>
          <Search
            size={15}
            className='absolute left-3 top-1/2 -translate-y-1/2'
            style={{ color: 'var(--color-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder='Tìm host...'
            aria-label='Tìm host'
            className='w-full pl-9 pr-3 py-2 rounded-lg text-sm font-medium outline-none'
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
          />
        </div>
      </div>

      <div className='flex-1 overflow-y-auto max-h-[22rem] p-2 space-y-1'>
        {isLoading ? (
          <div className='flex items-center justify-center gap-2 py-10'>
            <Loader2 size={15} className='animate-spin' style={{ color: 'var(--color-muted)' }} />
            <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
              Đang tải host...
            </span>
          </div>
        ) : isError ? (
          <p className='text-sm font-medium text-center py-10' style={{ color: 'var(--color-down)' }}>
            Không tải được danh sách host.
          </p>
        ) : hosts.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-center'>
            <Server size={20} style={{ color: 'var(--color-muted)' }} />
            <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
              {search ? 'Không có host phù hợp' : 'Chưa có host nào'}
            </p>
            <p className='text-xs' style={{ color: 'var(--color-muted)' }}>
              Thêm host ở trang Hosts để kết nối.
            </p>
          </div>
        ) : (
          hosts.map((host) => {
            const isActive = host.id === selectedId
            return (
              <button
                key={host.id}
                onClick={() => onSelect(host.id)}
                aria-pressed={isActive}
                className='w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer'
                style={{
                  background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  border: isActive ? '1.5px solid var(--cta)' : '1.5px solid transparent'
                }}
              >
                <div className='flex items-center gap-2'>
                  <span className='flex-1 text-sm font-bold truncate' style={{ color: 'var(--color-text)' }}>
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
                <p className='text-xs mt-0.5 truncate font-mono' style={{ color: 'var(--color-muted)' }}>
                  {host.username}@{host.hostname}:{host.port}
                </p>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
