import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Server, SquareTerminal, FolderOpen, Settings, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hosts', label: 'Hosts', icon: Server },
  { to: '/terminal', label: 'Terminal', icon: SquareTerminal },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/settings', label: 'Cài đặt', icon: Settings }
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Logo() {
  return (
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
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Logo />

      <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto'>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
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
            <item.icon size={18} />
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
    </>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className='min-h-screen'>
      <aside
        className='fixed top-0 left-0 h-screen w-64 hidden lg:flex flex-col z-20'
        style={{
          background: 'var(--color-surface)',
          borderRight: '3px solid var(--text)',
          boxShadow: '4px 0 0 rgba(45,55,72,0.06)'
        }}
      >
        <SidebarContent />
      </aside>

      <header
        className='lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3'
        style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--text)' }}
      >
        <div className='flex items-center gap-2.5'>
          <div
            className='w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs'
            style={{ background: 'var(--cta)', border: '2px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
          >
            S
          </div>
          <span className='font-extrabold text-sm' style={{ color: 'var(--color-text)' }}>
            ShellDeck
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label='Mở menu'
          aria-expanded={menuOpen}
          className='w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer'
          style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
        >
          <Menu size={18} />
        </button>
      </header>

      {menuOpen && (
        <div className='lg:hidden fixed inset-0 z-40'>
          <div
            className='absolute inset-0'
            style={{ background: 'rgba(45,55,72,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className='absolute top-0 left-0 h-full w-72 max-w-[85vw] flex flex-col animate-confirm'
            style={{ background: 'var(--color-surface)', borderRight: '3px solid var(--text)' }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              aria-label='Đóng menu'
              className='absolute top-4 right-3 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer z-10'
              style={{ color: 'var(--color-muted)' }}
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className='lg:pl-64 min-h-screen'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'>{children}</div>
      </main>
    </div>
  )
}
