import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  FolderOpen,
  History,
  Loader2,
  Plus,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SquareTerminal,
  Zap
} from 'lucide-react'
import { useAuthStore } from '@stores/authStore'
import { formatFromNow } from '@lib/format'
import { QuickConnectModal } from './components/QuickConnectModal'
import { StatCard } from './components/StatCard'
import { useDashboardHosts, useDashboardSessions } from './hooks'
import { useDashboardStore } from './store'

const shortcuts = [
  { to: '/terminal', label: 'Terminal', icon: SquareTerminal },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/hosts', label: 'Hosts', icon: Server },
  { to: '/settings', label: 'Cài đặt', icon: Settings }
]

const card = {
  background: 'var(--color-surface)',
  border: '2px solid var(--color-border)',
  boxShadow: 'var(--clay-shadow-md)'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { hosts, total, trusted, untrusted, recent, isLoading, isError } = useDashboardHosts()
  const sessions = useDashboardSessions()
  const { showQuickConnect, openQuickConnect, closeQuickConnect } = useDashboardStore()

  const connect = (hostId: string) => {
    closeQuickConnect()
    navigate(`/terminal?host=${hostId}`)
  }

  return (
    <div className='space-y-7'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.18em]' style={{ color: 'var(--color-primary)' }}>
            ShellDeck
          </p>
          <h1 className='text-3xl font-extrabold mt-1' style={{ color: 'var(--color-text)' }}>
            Xin chào, {user?.fullName?.split(' ').slice(-1)[0] ?? 'bạn'}
          </h1>
          <p className='text-sm mt-1 font-medium' style={{ color: 'var(--color-muted)' }}>
            SSH và SFTP ngay trong trình duyệt
          </p>
        </div>
        <div className='flex items-center gap-2.5'>
          <button
            onClick={() => navigate('/hosts')}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200'
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)',
              boxShadow: 'var(--clay-shadow-sm)'
            }}
          >
            <Plus size={16} />
            Thêm host
          </button>
          <button
            onClick={openQuickConnect}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200 btn-primary'
            style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
          >
            <Zap size={16} />
            Kết nối nhanh
          </button>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          icon={Server}
          label='Số host'
          value={String(total)}
          hint='Máy chủ SSH của bạn'
          tone='var(--primary)'
        />
        <StatCard
          icon={History}
          label='Phiên gần đây'
          value={sessions.isError ? '—' : String(sessions.total)}
          hint={sessions.isError ? 'Chưa khả dụng' : 'Tổng số phiên đã ghi'}
          tone='var(--secondary)'
        />
        <StatCard
          icon={ShieldCheck}
          label='Host key đã tin'
          value={String(trusted)}
          hint='Kết nối an toàn'
          tone='var(--accent-mint)'
        />
        <StatCard
          icon={ShieldAlert}
          label='Chưa xác thực'
          value={String(untrusted)}
          hint='Cần kiểm tra fingerprint'
          tone='var(--primary)'
        />
      </div>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <section className='rounded-3xl overflow-hidden' style={card}>
          <div
            className='flex items-center justify-between px-5 py-4'
            style={{ borderBottom: '1.5px solid var(--color-border)' }}
          >
            <h2 className='text-base font-extrabold' style={{ color: 'var(--color-text)' }}>
              Hosts dùng gần nhất
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
            <div className='flex items-center justify-center gap-2 py-16'>
              <Loader2 size={16} className='animate-spin' style={{ color: 'var(--color-muted)' }} />
              <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
                Đang tải...
              </span>
            </div>
          ) : isError ? (
            <p className='text-sm font-medium text-center py-16' style={{ color: 'var(--color-down)' }}>
              Không tải được danh sách host. Hãy thử lại sau.
            </p>
          ) : recent.length === 0 ? (
            <div className='px-5 py-14 flex flex-col items-center gap-4 text-center'>
              <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center'
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                <Server size={24} />
              </div>
              <p className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
                Chưa có host nào
              </p>
              <p className='text-sm max-w-sm' style={{ color: 'var(--color-muted)' }}>
                Thêm máy chủ SSH đầu tiên để mở terminal và duyệt file ngay trong trình duyệt.
              </p>
              <button
                onClick={() => navigate('/hosts')}
                className='mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer btn-primary'
                style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
              >
                <Plus size={16} />
                Thêm host
              </button>
            </div>
          ) : (
            <ul>
              {recent.map((host, index) => (
                <li
                  key={host.id}
                  className='flex flex-wrap items-center gap-3 px-5 py-3.5'
                  style={{ borderBottom: index === recent.length - 1 ? 'none' : '1px solid var(--color-border)' }}
                >
                  <div
                    className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
                    style={{
                      background: host.hostKeyFingerprint ? 'var(--accent-mint)' : 'var(--primary)',
                      color: 'var(--text)'
                    }}
                  >
                    {host.hostKeyFingerprint ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-bold truncate' style={{ color: 'var(--color-text)' }}>
                      {host.name}
                    </p>
                    <p className='text-xs truncate font-mono mt-0.5' style={{ color: 'var(--color-muted)' }}>
                      {host.username}@{host.hostname}:{host.port} · {formatFromNow(host.lastConnectedAt)}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <button
                      onClick={() => navigate(`/terminal?host=${host.id}`)}
                      className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer'
                      style={{ background: 'var(--cta)', border: '1.5px solid var(--text)' }}
                    >
                      <SquareTerminal size={13} />
                      Kết nối
                    </button>
                    <button
                      onClick={() => navigate(`/files/${host.id}`)}
                      aria-label={`Mở files của ${host.name}`}
                      className='w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer'
                      style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
                    >
                      <FolderOpen size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className='space-y-5'>
          <section className='rounded-3xl overflow-hidden' style={card}>
            <div
              className='flex items-center gap-2 px-5 py-4'
              style={{ borderBottom: '1.5px solid var(--color-border)' }}
            >
              <History size={16} style={{ color: 'var(--color-primary)' }} />
              <h2 className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
                Phiên gần đây
              </h2>
            </div>
            <div className='px-5 py-4'>
              {sessions.isLoading ? (
                <div className='flex items-center gap-2 py-2'>
                  <Loader2 size={14} className='animate-spin' style={{ color: 'var(--color-muted)' }} />
                  <span className='text-xs font-medium' style={{ color: 'var(--color-muted)' }}>
                    Đang tải...
                  </span>
                </div>
              ) : sessions.isError ? (
                <p className='text-xs leading-relaxed' style={{ color: 'var(--color-muted)' }}>
                  Nhật ký phiên chưa khả dụng với server hiện tại.
                </p>
              ) : sessions.sessions.length === 0 ? (
                <p className='text-xs leading-relaxed' style={{ color: 'var(--color-muted)' }}>
                  Server chưa ghi nhận phiên SSH nào.
                </p>
              ) : (
                <ul className='space-y-2.5'>
                  {sessions.sessions.map((session) => (
                    <li key={session.id} className='flex items-start gap-2'>
                      <Clock size={13} className='mt-0.5 shrink-0' style={{ color: 'var(--color-muted)' }} />
                      <div className='min-w-0'>
                        <p className='text-xs font-bold truncate' style={{ color: 'var(--color-text)' }}>
                          {session.hostLabel}
                        </p>
                        <p className='text-[11px]' style={{ color: 'var(--color-muted)' }}>
                          {formatFromNow(session.startedAt)}
                          {session.clientIp ? ` · ${session.clientIp}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className='rounded-3xl overflow-hidden' style={card}>
            <div className='px-5 py-4' style={{ borderBottom: '1.5px solid var(--color-border)' }}>
              <h2 className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
                Lối tắt
              </h2>
            </div>
            <div className='p-2'>
              {shortcuts.map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150'
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary-light)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <item.icon size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className='flex-1 text-left'>{item.label}</span>
                  <ArrowRight size={14} style={{ color: 'var(--color-muted)' }} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showQuickConnect && (
        <QuickConnectModal
          hosts={hosts}
          isLoading={isLoading}
          isError={isError}
          onClose={closeQuickConnect}
          onConnect={connect}
        />
      )}
    </div>
  )
}
