import { useRef, useState } from 'react'
import { AlertTriangle, ChevronUp, FolderPlus, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Host, SftpEntry } from '@lib/types'
import { sftpService } from '@lib/services/sftp.service'
import { useSftpActions, useSftpList } from '../hooks'
import { useFilesStore } from '../store'
import { fullPath, isHostKeyError, parentDir } from '../utils'
import { Breadcrumbs } from './Breadcrumbs'
import { DeleteDialog } from './DeleteDialog'
import { FileTable } from './FileTable'
import { PromptDialog } from './PromptDialog'
import { TextEditDialog } from './TextEditDialog'
import { UploadPanel, type UploadItem } from './UploadPanel'

interface FileBrowserProps {
  host: Host
  onOpenTerminal: (hostId: string) => void
}

export function FileBrowser({ host, onOpenTerminal }: FileBrowserProps) {
  // dir is the listing path relative to home; '' = home.
  const [dir, setDir] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const list = useSftpList(host.id, dir)
  const { mkdir, rename, remove } = useSftpActions(host.id)
  const { dialog, target, openDialog, closeDialog } = useFilesStore()

  // One file at a time keeps the progress bars honest and the server happy.
  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID()
      setUploads((u) => [...u, { id, name: file.name, percent: 0, state: 'busy' }])

      const patch = (next: Partial<UploadItem>) =>
        setUploads((u) => u.map((item) => (item.id === id ? { ...item, ...next } : item)))

      try {
        await sftpService.uploadFile(host.id, dir, file, (percent) => patch({ percent }))
        patch({ state: 'done', percent: 100 })
      } catch (e) {
        patch({ state: 'error', error: e instanceof Error ? e.message : 'Tải lên thất bại' })
      }

      list.refetch()
    }
  }

  const download = (entry: SftpEntry) => {
    sftpService
      .downloadFile(host.id, fullPath(dir, entry.name), entry.name)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Không tải được file'))
  }

  const hostKeyProblem = list.isError && isHostKeyError(list.error)
  const entries = list.data?.entries ?? []

  return (
    <div
      className='rounded-3xl p-4 sm:p-5 flex flex-col gap-4 transition-colors'
      style={{
        background: 'var(--color-surface)',
        border: `2px solid ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
        boxShadow: 'var(--clay-shadow-md)'
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) void uploadFiles(files)
      }}
    >
      <div className='flex items-center gap-2 flex-wrap'>
        <Breadcrumbs dir={dir} homeLabel='Trang chủ' onNavigate={setDir} />

        <span className='flex-1' />

        {dir !== '' && (
          <button
            onClick={() => setDir(parentDir(dir))}
            title='Lên thư mục cha'
            className='w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer'
            style={{
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <ChevronUp size={15} />
          </button>
        )}

        <button
          onClick={() => openDialog('mkdir', null)}
          className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer'
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)'
          }}
        >
          <FolderPlus size={14} />
          Thư mục mới
        </button>

        <button
          onClick={() => inputRef.current?.click()}
          className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer'
          style={{ background: 'var(--cta)', border: '1.5px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
        >
          <Upload size={14} />
          Tải lên
        </button>
        <input
          ref={inputRef}
          type='file'
          multiple
          className='hidden'
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) void uploadFiles(files)
            // Reset so picking the same file again still fires onChange.
            e.target.value = ''
          }}
        />
      </div>

      <UploadPanel items={uploads} />

      {hostKeyProblem ? (
        <div
          className='rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4'
          style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid var(--color-warning)' }}
        >
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
            style={{ background: 'var(--color-surface)', color: 'var(--color-warning)' }}
          >
            <AlertTriangle size={18} />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
              Host key chưa được tin tưởng
            </p>
            <p className='text-sm mt-0.5' style={{ color: 'var(--color-muted)' }}>
              Kiểm tra host trước: mở terminal hoặc chạy Kiểm tra ở trang Hosts và xác nhận fingerprint.
            </p>
          </div>
          <button
            onClick={() => onOpenTerminal(host.id)}
            className='shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer'
            style={{ background: 'var(--cta)', border: '2px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
          >
            Kiểm tra host trước
          </button>
        </div>
      ) : list.isError ? (
        <div
          className='rounded-2xl p-4 flex flex-wrap items-center gap-3 text-sm font-semibold'
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1.5px solid var(--color-down)',
            color: 'var(--color-text)'
          }}
        >
          <span className='flex-1 min-w-40'>{list.error?.message ?? 'Không đọc được thư mục'}</span>
          <button
            onClick={() => list.refetch()}
            className='px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer'
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            Thử lại
          </button>
          <button
            onClick={() => setDir('')}
            className='px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer'
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            Về thư mục gốc
          </button>
        </div>
      ) : list.isPending ? (
        <div className='flex items-center justify-center gap-2 py-16'>
          <Loader2 size={16} className='animate-spin' />
          <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
            Đang đọc thư mục...
          </span>
        </div>
      ) : (
        <FileTable
          entries={entries}
          onOpenDir={(entry) => setDir(fullPath(dir, entry.name))}
          onDownload={download}
          onEdit={(entry) => openDialog('edit', entry)}
          onRename={(entry) => openDialog('rename', entry)}
          onDelete={(entry) => openDialog('delete', entry)}
        />
      )}

      {dialog === 'mkdir' && (
        <PromptDialog
          title='Thư mục mới'
          label='Tên thư mục'
          hint={`Sẽ tạo trong: ${dir === '' ? 'trang chủ' : dir}`}
          confirmLabel='Tạo'
          busy={mkdir.isPending}
          onConfirm={(name) => mkdir.mutate(fullPath(dir, name), { onSuccess: closeDialog })}
          onClose={closeDialog}
        />
      )}

      {dialog === 'rename' && target && (
        <PromptDialog
          title='Đổi tên'
          label='Tên mới'
          hint={`Từ: ${target.name}`}
          initialValue={target.name}
          confirmLabel='Đổi tên'
          busy={rename.isPending}
          onConfirm={(name) =>
            rename.mutate(
              { from: fullPath(dir, target.name), to: fullPath(parentDir(dir), name) },
              { onSuccess: closeDialog }
            )
          }
          onClose={closeDialog}
        />
      )}

      {dialog === 'delete' && target && (
        <DeleteDialog
          key={target.name}
          entry={target}
          busy={remove.isPending}
          onConfirm={(recursive) =>
            remove.mutate({ path: fullPath(dir, target.name), recursive }, { onSuccess: closeDialog })
          }
          onClose={closeDialog}
        />
      )}

      {dialog === 'edit' && target && (
        <TextEditDialog key={target.name} hostId={host.id} dir={dir} entry={target} onClose={closeDialog} />
      )}
    </div>
  )
}
