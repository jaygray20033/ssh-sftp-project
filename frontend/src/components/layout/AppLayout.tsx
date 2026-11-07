import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Server, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/hosts', label: 'Hosts', icon: <Server size={18} /> },
  { to: '/settings', label: 'Cài đặt', icon: <Settings size={18} /> }
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className='fixed top-0 left-0 h-screen w-64 flex flex-col z-20'
      style={{
        background: 'var(--color-surface)',
        borderRight: '3px solid var(--text)',
        boxShadow: '4px 0 0 rgba(45,55,72,0.06)'
      }}
    >
      {/* Logo */}
      <div className='px-6 py-5 flex items-center gap-3' style={{ borderBottom: '2px solid var(--text)' }}>
        <div
          className='w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0'
          style={{ background: 'var(--cta)', border: '2px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
        >
          S
        </div>
        <span className='font-extrabold text-base tracking-tight' style={{ color: 'var(--color-text)' }}>
          ShellDeck
        </span>
      </div>

      {/* Nav */}
      <nav className='flex-1 px-3 py-4 space-y-1'>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer',
                isActive
                  ? 'text-white'
                  : 'text-(--color-muted) hover:bg-(--color-primary-light) hover:text-(--color-primary)'
              ].join(' ')
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'var(--cta)',
                    border: '2px solid var(--text)',
                    boxShadow: '3px 3px 0 var(--text)'
                  }
                : {}
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className='px-3 pb-4' style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className='flex items-center gap-3 px-3 pt-4 pb-2'>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className='w-9 h-9 rounded-full object-cover shrink-0'
              style={{ boxShadow: 'var(--clay-shadow-sm)' }}
            />
          ) : (
            <div
              className='w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0'
              style={{
                background: 'var(--primary)',
                border: '2px solid var(--text)',
                boxShadow: '2px 2px 0 var(--text)'
              }}
            >
              {user ? getInitials(user.fullName) : '?'}
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-bold truncate' style={{ color: 'var(--color-text)' }}>
              {user?.fullName ?? ''}
            </p>
            <p className='text-xs truncate' style={{ color: 'var(--color-muted)' }}>
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          aria-label='Đăng xuất'
          className='w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer btn-ghost-danger'
          style={{ color: 'var(--color-down)' }}
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <main className='flex-1 pl-64 min-h-screen' style={{ background: 'inherit' }}>
        <div className='max-w-5xl mx-auto px-8 py-8'>{children}</div>
      </main>
    </div>
  )
}
