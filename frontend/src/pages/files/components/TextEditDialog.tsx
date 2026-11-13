import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { SftpEntry } from '@lib/types'
import { sftpService } from '@lib/services/sftp.service'
import { formatBytes } from '@lib/format'
import { fullPath } from '../utils'

interface TextEditDialogProps {
  hostId: string
  dir: string
  entry: SftpEntry
  onClose: () => void
}

// P2: small text files get a textarea; saving re-uploads the file under the same name.
export function TextEditDialog({ hostId, dir, entry, onClose }: TextEditDialogProps) {
  const remotePath = fullPath(dir, entry.name)
  const qc = useQueryClient()
  const [content, setContent] = useState('')

  const fileQuery = useQuery({
    queryKey: ['sftp-text', hostId, remotePath],
    queryFn: () => sftpService.readFileText(hostId, remotePath),
    retry: false
  })

  // A NUL byte means the file is not text, so keep the editor closed.
  const isBinary = typeof fileQuery.data === 'string' && fileQuery.data.includes('\u0000')
  const loaded = typeof fileQuery.data === 'string' && !isBinary

  useEffect(() => {
    if (fileQuery.data && !isBinary) setContent(fileQuery.data)
  }, [fileQuery.data, isBinary])

  const save = useMutation({
    mutationFn: () => sftpService.uploadFile(hostId, dir, new File([content], entry.name)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sftp', hostId] })
      qc.invalidateQueries({ queryKey: ['sftp-text', hostId, remotePath] })
      toast.success('Đã lưu file')
      onClose()
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Không lưu được file')
  })

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className='w-full max-w-3xl rounded-3xl p-6 flex flex-col gap-4'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-lg)'
        }}
      >
        <div className='flex items-center gap-3 min-w-0'>
          <h2 className='text-lg font-extrabold truncate' style={{ color: 'var(--color-text)' }}>
            {entry.name}
          </h2>
          <span className='text-xs shrink-0' style={{ color: 'var(--color-muted)' }}>
            {formatBytes(entry.size)}
          </span>
          <span className='flex-1' />
          <span className='text-xs' style={{ color: 'var(--color-muted)' }}>
            Lưu đè trực tiếp lên server
          </span>
        </div>

        {fileQuery.isLoading ? (
          <div className='flex items-center justify-center gap-2 py-16'>
            <Loader2 size={16} className='animate-spin' />
            <span className='text-sm' style={{ color: 'var(--color-muted)' }}>
              Đang đọc file...
            </span>
          </div>
        ) : fileQuery.isError ? (
          <p className='text-sm font-medium py-8 text-center' style={{ color: 'var(--color-down)' }}>
            {fileQuery.error instanceof Error ? fileQuery.error.message : 'Không đọc được file'}
          </p>
        ) : isBinary ? (
          <p className='text-sm font-medium py-8 text-center' style={{ color: 'var(--color-muted)' }}>
            File này có vẻ là file nhị phân — chỉ mở được bằng Tải xuống.
          </p>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className='w-full h-[50vh] px-4 py-3 rounded-xl text-xs font-mono outline-none resize-none'
            style={{
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          />
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
            Đóng
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!loaded || save.isPending || content === fileQuery.data}
            className='flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60'
            style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
          >
            {save.isPending ? <Loader2 size={16} className='animate-spin' /> : <Save size={15} />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
