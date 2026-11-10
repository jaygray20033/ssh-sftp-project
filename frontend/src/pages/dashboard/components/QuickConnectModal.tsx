import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, Server, ShieldAlert, ShieldCheck, SquareTerminal } from 'lucide-react'
import type { Host } from '@lib/types'
import { ModalCloseBtn, ModalOverlay } from '@components/ui'

interface QuickConnectModalProps {
  hosts: Host[]
  isLoading: boolean
  isError: boolean
  onClose: () => void
  onConnect: (hostId: string) => void
}

export function QuickConnectModal({ hosts, isLoading, isError, onClose, onConnect }: QuickConnectModalProps) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return hosts
    return hosts.filter((h) => h.name.toLowerCase().includes(term) || h.hostname.toLowerCase().includes(term))
  }, [hosts, search])

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className='w-full max-w-lg rounded-3xl flex flex-col overflow-hidden'
        style={{
          background: 'var(--color-surface)',
          border: '3px solid var(--text)',
          boxShadow: 'var(--clay-shadow-lg)'
        }}
      >
        <div className='flex items-center gap-3 px-5 py-4' style={{ borderBottom: '1.5px solid var(--color-border)' }}>
          <div
            className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <SquareTerminal size={17} />
          </div>
          <div className='flex-1 min-w-0'>
            <h2 className='text-base font-extrabold' style={{ color: 'var(--color-text)' }}>
              Kết nối nhanh
            </h2>
            <p className='text-xs' style={{ color: 'var(--color-muted)' }}>
              Chọn host để mở bảng điều khiển terminal
            </p>
          </div>
          <ModalCloseBtn onClose={onClose} />
        </div>

        <div className='p-4' style={{ borderBottom: '1.5px solid var(--color-border)' }}>
          <div className='relative'>
            <Search
              size={15}
              className='absolute left-3 top-1/2 -translate-y-1/2'
              style={{ color: 'var(--color-muted)' }}
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Tìm host...'
              aria-label='Tìm host'
              className='w-full pl-9 pr-3 py-2 rounded-lg text-sm font-medium outline-none'
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>

        <div className='console-scroll p-3 space-y-1 overflow-y-auto max-h-80'>
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
          ) : visible.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-10 text-center'>
              <Server size={20} style={{ color: 'var(--color-muted)' }} />
              <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
                {search ? 'Không có host phù hợp' : 'Chưa có host nào'}
              </p>
              <p className='text-xs' style={{ color: 'var(--color-muted)' }}>
                Thêm host trong trang Hosts để kết nối.
              </p>
            </div>
          ) : (
            visible.map((host) => (
              <button
                key={host.id}
                onClick={() => onConnect(host.id)}
                className='w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-150'
                style={{ border: '1.5px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary-light)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold truncate' style={{ color: 'var(--color-text)' }}>
                    {host.name}
                  </p>
                  <p className='text-xs truncate font-mono' style={{ color: 'var(--color-muted)' }}>
                    {host.username}@{host.hostname}:{host.port}
                  </p>
                </div>
                {host.hostKeyFingerprint ? (
                  <ShieldCheck size={15} style={{ color: 'var(--color-up)' }} aria-label='Host key đã tin tưởng' />
                ) : (
                  <ShieldAlert
                    size={15}
                    style={{ color: 'var(--color-warning)' }}
                    aria-label='Chưa tin tưởng host key'
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </ModalOverlay>
  )
}
