import { Download, File, Folder, Pencil, Trash2, FileText } from 'lucide-react'
import type { SftpEntry } from '@lib/types'
import { formatBytes, formatDateTime } from '@lib/format'
import { isProbablyText } from '../utils'

interface FileTableProps {
  entries: SftpEntry[]
  onOpenDir: (entry: SftpEntry) => void
  onDownload: (entry: SftpEntry) => void
  onEdit: (entry: SftpEntry) => void
  onRename: (entry: SftpEntry) => void
  onDelete: (entry: SftpEntry) => void
}

const grid = 'grid grid-cols-[minmax(0,2fr)_5rem_11rem_8rem_minmax(0,7rem)] gap-2 items-center'

const actionBtn = 'w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shrink-0 hover:opacity-70'

const actionStyle = {
  background: 'var(--color-bg)',
  border: '1.5px solid var(--color-border)',
  color: 'var(--color-text)'
}

export function FileTable({ entries, onOpenDir, onDownload, onEdit, onRename, onDelete }: FileTableProps) {
  if (entries.length === 0) {
    return (
      <div className='px-5 py-12 flex flex-col items-center gap-3 text-center'>
        <div
          className='w-12 h-12 rounded-2xl flex items-center justify-center'
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <Folder size={20} />
        </div>
        <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
          Thư mục trống
        </p>
        <p className='text-xs' style={{ color: 'var(--color-muted)' }}>
          Kéo thả file vào đây hoặc bấm nút Tải lên.
        </p>
      </div>
    )
  }

  return (
    <div className='rounded-2xl overflow-hidden' style={{ border: '1.5px solid var(--color-border)' }}>
      <div
        className={`${grid} px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest`}
        style={{ color: 'var(--color-muted)', background: 'var(--color-bg)' }}
      >
        <span>Tên</span>
        <span>Kích thước</span>
        <span>Ngày sửa</span>
        <span>Quyền</span>
        <span className='text-right'>Thao tác</span>
      </div>

      {entries.map((entry) => (
        <div
          key={entry.name}
          className={`${grid} px-4 py-2.5 text-xs`}
          style={{ borderTop: '1.5px solid var(--color-border)' }}
        >
          <span className='flex items-center gap-2 min-w-0'>
            {entry.type === 'directory' ? (
              <button
                onClick={() => onOpenDir(entry)}
                className='flex items-center gap-2 min-w-0 font-bold cursor-pointer hover:underline text-left'
                style={{ color: 'var(--color-text)' }}
              >
                <Folder size={14} className='shrink-0' style={{ color: 'var(--color-primary)' }} />
                <span className='truncate'>{entry.name}</span>
              </button>
            ) : (
              <>
                <File size={14} className='shrink-0' style={{ color: 'var(--color-muted)' }} />
                <span className='truncate font-medium' style={{ color: 'var(--color-text)' }} title={entry.name}>
                  {entry.name}
                </span>
              </>
            )}
          </span>

          <span style={{ color: 'var(--color-muted)' }}>
            {entry.type === 'directory' ? '—' : formatBytes(entry.size)}
          </span>
          <span style={{ color: 'var(--color-muted)' }}>{formatDateTime(entry.modifiedAt)}</span>
          <span
            className='font-mono text-[11px] truncate'
            style={{ color: 'var(--color-muted)' }}
            title={entry.permissions}
          >
            {entry.permissions || '—'}
          </span>

          <span className='flex items-center justify-end gap-1.5'>
            {entry.type === 'file' && isProbablyText(entry) && (
              <button onClick={() => onEdit(entry)} title='Xem / sửa' className={actionBtn} style={actionStyle}>
                <FileText size={13} />
              </button>
            )}
            {entry.type === 'file' && (
              <button onClick={() => onDownload(entry)} title='Tải xuống' className={actionBtn} style={actionStyle}>
                <Download size={13} />
              </button>
            )}
            <button onClick={() => onRename(entry)} title='Đổi tên' className={actionBtn} style={actionStyle}>
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(entry)} title='Xoá' className={actionBtn} style={actionStyle}>
              <Trash2 size={13} style={{ color: 'var(--color-down)' }} />
            </button>
          </span>
        </div>
      ))}
    </div>
  )
}
