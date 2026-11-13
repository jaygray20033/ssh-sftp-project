import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import type { SftpEntry } from '@lib/types'

interface DeleteDialogProps {
  entry: SftpEntry
  busy: boolean
  onConfirm: (recursive: boolean) => void
  onClose: () => void
}

export function DeleteDialog({ entry, busy, onConfirm, onClose }: DeleteDialogProps) {
  const [recursive, setRecursive] = useState(false)
  const isDir = entry.type === 'directory'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
            {isDir ? 'Xoá thư mục?' : 'Xoá file?'}
          </h2>
          <p className='text-sm break-all' style={{ color: 'var(--color-muted)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{entry.name}</strong> sẽ bị xoá vĩnh viễn khỏi server, không
            thể hoàn tác.
          </p>
        </div>

        {isDir && (
          <label
            className='flex items-center gap-2.5 text-sm font-bold cursor-pointer'
            style={{ color: 'var(--color-text)' }}
          >
            <input type='checkbox' checked={recursive} onChange={(e) => setRecursive(e.target.checked)} />
            Xoá cả nội dung bên trong (đệ quy)
          </label>
        )}

        <div className='flex gap-3'>
          <button
            onClick={onClose}
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
            onClick={() => onConfirm(recursive)}
            disabled={busy}
            className='flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60'
            style={{ background: 'var(--color-down)', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}
          >
            {busy && <Loader2 size={16} className='animate-spin' />}
            Xoá
          </button>
        </div>
      </div>
    </div>
  )
}
