import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MonitorPlay, TerminalSquare } from 'lucide-react'
import { sessionsService } from '@lib/services/sessions.service'
import { formatDateTime } from '@lib/format'
import { SectionCard } from './components'

// "Phiên SSH gần đây": read-only audit list from GET /sessions (B07).
export function SessionsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => sessionsService.getSessions({ limit: 10 }),
    refetchOnWindowFocus: false
  })
  const entries = data?.entries ?? []

  return (
    <SectionCard title='Phiên SSH gần đây'>
      {isLoading ? (
        <div className='flex items-center justify-center gap-2 py-10'>
          <Loader2 size={16} className='animate-spin' />
          <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
            Đang tải...
          </span>
        </div>
      ) : isError ? (
        <p className='text-sm font-medium py-8 text-center' style={{ color: 'var(--color-down)' }}>
          Không tải được nhật ký phiên. Thử lại sau.
        </p>
      ) : entries.length === 0 ? (
        <div className='flex flex-col items-center gap-2 py-10 text-center'>
          <div
            className='w-12 h-12 rounded-2xl flex items-center justify-center'
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <TerminalSquare size={20} />
          </div>
          <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
            Chưa có phiên nào
          </p>
          <p className='text-xs max-w-xs' style={{ color: 'var(--color-muted)' }}>
            Các phiên vào terminal của bạn sẽ được liệt kê ở đây (không lưu nội dung gõ).
          </p>
        </div>
      ) : (
        <div className='rounded-2xl overflow-hidden' style={{ border: '1.5px solid var(--color-border)' }}>
          <div
            className='grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_5.5rem] gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest'
            style={{ color: 'var(--color-muted)', background: 'var(--color-bg)' }}
          >
            <span>Host</span>
            <span>Thời gian</span>
            <span>IP</span>
            <span>Kết thúc</span>
            <span className='text-right'>Bản ghi</span>
          </div>
          {entries.map((s) => (
            <div
              key={s.id}
              className='grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_5.5rem] gap-2 px-4 py-3 text-xs items-center'
              style={{ borderTop: '1.5px solid var(--color-border)' }}
            >
              <span className='font-bold truncate' style={{ color: 'var(--color-text)' }} title={s.hostLabel}>
                <span className='inline-flex items-center gap-1.5'>
                  <MonitorPlay size={12} className='shrink-0' style={{ color: 'var(--color-muted)' }} />
                  {s.hostLabel}
                </span>
              </span>
              <span style={{ color: 'var(--color-muted)' }}>
                {formatDateTime(s.startedAt)}
                {s.endedAt ? ` → ${formatDateTime(s.endedAt)}` : ''}
              </span>
              <span className='font-mono truncate' style={{ color: 'var(--color-muted)' }} title={s.clientIp}>
                {s.clientIp}
              </span>
              <span style={{ color: s.endedAt ? 'var(--color-muted)' : 'var(--color-primary)' }} className='truncate'>
                {s.endedAt ? (s.closeReason ?? 'Đã đóng') : 'Đang chạy'}
              </span>
              {/* B11 replay page opens only when an asciicast file exists. */}
              <span className='text-right'>
                {s.hasRecording ? (
                  <Link
                    to={`/sessions/${s.id}/replay`}
                    className='text-xs font-bold hover:underline'
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Phát lại
                  </Link>
                ) : (
                  <span style={{ color: 'var(--color-muted)' }}>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className='text-xs' style={{ color: 'var(--color-muted)' }}>
        Nhật ký chỉ chứa metadata (host, thời gian, IP). ShellDeck không lưu nội dung bạn gõ trong phiên.
      </p>
    </SectionCard>
  )
}
