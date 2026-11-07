import { Trash2, Loader2 } from 'lucide-react'
import { useHosts } from '../hooks'

export function DeleteDialog() {
  const { showDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting, hosts, deletingHostId } = useHosts()

  if (!showDeleteDialog) return null

  const host = hosts.find((h) => h.id === deletingHostId)

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className='w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-lg)'
        }}
      >
        <div className='flex flex-col gap-2 text-center'>
          <div
            className='w-12 h-12 rounded-2xl mx-auto flex items-center justify-center'
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-down)' }}
          >
            <Trash2 size={15} />
          </div>
          <h2 className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
            Xoá host?
          </h2>
          <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
            Host <strong style={{ color: 'var(--color-text)' }}>{host?.name}</strong> và thông tin đăng nhập đã mã hoá
            sẽ bị xoá vĩnh viễn.
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={closeDeleteDialog}
            className='flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer'
            style={{
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-muted)'
            }}
          >
            Huỷ
          </button>
          <button
            onClick={confirmDelete}
            disabled={isDeleting}
            className='flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60 btn-ghost-danger'
            style={{ background: 'var(--color-down)', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}
          >
            {isDeleting && <Loader2 size={16} className='animate-spin' />}
            Xoá
          </button>
        </div>
      </div>
    </div>
  )
}
