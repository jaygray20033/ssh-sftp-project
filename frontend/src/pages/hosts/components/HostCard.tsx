import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock, Pencil, Trash2, Terminal } from 'lucide-react'
import type { Host } from '@lib/types'
import { useHosts } from '../hooks'

export function HostCard({ host }: { host: Host }) {
  const navigate = useNavigate()
  const { openEditModal, openDeleteDialog } = useHosts()

  return (
    <div
      className='rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4'
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        boxShadow: 'var(--clay-shadow-sm)'
      }}
    >
      <div className='flex items-start gap-3 flex-1 min-w-0'>
        <div
          className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <Terminal size={18} />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='font-bold text-sm' style={{ color: 'var(--color-text)' }}>
              {host.name}
            </span>
            <span
              className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg'
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              {host.authType === 'private_key' ? <KeyRound size={11} /> : <Lock size={11} />}
              {host.authType === 'private_key' ? 'Private key' : 'Mật khẩu'}
            </span>
            {host.tags.map((tag) => (
              <span
                key={tag}
                className='text-xs font-medium px-2 py-0.5 rounded-lg'
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className='text-xs mt-1 truncate font-mono' style={{ color: 'var(--color-muted)' }}>
            {host.username}@{host.hostname}:{host.port}
          </p>
          <p className='text-xs mt-0.5' style={{ color: 'var(--color-muted)' }}>
            {host.hostKeyFingerprint ? `Host key: ${host.hostKeyFingerprint}` : 'Chưa xác thực host key'}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2 shrink-0'>
        <button
          onClick={() => navigate(`/terminal?host=${host.id}`)}
          className='px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all duration-150'
          style={{ background: 'var(--cta)', border: '1.5px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
        >
          Kết nối
        </button>
        <button
          onClick={() => openEditModal(host)}
          aria-label='Sửa host'
          className='w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer'
          style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => openDeleteDialog(host.id)}
          aria-label='Xoá host'
          className='w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer btn-ghost-danger'
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-down)'
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
