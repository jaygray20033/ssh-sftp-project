import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { create, type Player } from 'asciinema-player'
import 'asciinema-player/dist/bundle/asciinema-player.css'
import { ArrowLeft, Download, Film, Loader2 } from 'lucide-react'
import { ApiError } from '@lib/axios'
import { sessionsService } from '@lib/services/sessions.service'
import { formatDateTime } from '@lib/format'
import { useTerminalStore } from '@pages/terminal/store'

// F07: replays an asciicast v2 recording (B11) with asciinema-player.
export default function ReplayPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useTerminalStore((state) => state.theme)

  // Header meta comes from the audit list; the player itself only needs the .cast blob.
  const sessionQuery = useQuery({
    queryKey: ['sessions', 'replay-list'],
    queryFn: () => sessionsService.getSessions({ limit: 100 }),
    retry: false
  })
  const session = sessionQuery.data?.entries.find((item) => item.id === id) ?? null

  const recordingQuery = useQuery({
    queryKey: ['session-recording', id],
    queryFn: () => sessionsService.getRecording(id),
    retry: false,
    staleTime: Infinity
  })

  useEffect(() => {
    const container = containerRef.current
    const blob = recordingQuery.data
    if (!container || !blob) return

    let player: Player | null = null
    let cancelled = false

    // The recording URL needs a Bearer header, so feed the text to the player
    // instead of letting it fetch the URL itself.
    void blob.text().then((cast) => {
      if (cancelled) return
      player = create({ data: cast, parser: 'asciicast' }, container, {
        autoPlay: false,
        fit: 'width',
        theme: theme === 'dark' ? 'monokai' : 'tango'
      })
    })

    return () => {
      cancelled = true
      player?.dispose()
    }
  }, [recordingQuery.data, theme])

  const downloadCast = () => {
    if (!recordingQuery.data) return
    const url = URL.createObjectURL(recordingQuery.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `session-${id}.cast`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const noRecording = recordingQuery.error instanceof ApiError && recordingQuery.error.status === 404

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
            Phát lại phiên
          </h1>
          <p className='text-sm mt-0.5 font-medium truncate' style={{ color: 'var(--color-muted)' }}>
            {session
              ? `${session.hostLabel} · ${formatDateTime(session.startedAt)}${
                  session.endedAt ? ` → ${formatDateTime(session.endedAt)}` : ''
                }`
              : 'Đang tải thông tin phiên...'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {recordingQuery.data && (
            <button
              onClick={downloadCast}
              className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer'
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <Download size={14} />
              Tải file .cast
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer'
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
        </div>
      </div>

      <div
        className='rounded-3xl p-4 sm:p-5'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-md)'
        }}
      >
        {recordingQuery.isPending ? (
          <div className='flex items-center justify-center gap-2 py-20'>
            <Loader2 size={16} className='animate-spin' />
            <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
              Đang tải bản ghi...
            </span>
          </div>
        ) : noRecording ? (
          <div className='py-16 flex flex-col items-center gap-3 text-center px-6'>
            <div
              className='w-12 h-12 rounded-2xl flex items-center justify-center'
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Film size={20} />
            </div>
            <p className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
              Phiên này không có bản ghi
            </p>
            <p className='text-sm max-w-md' style={{ color: 'var(--color-muted)' }}>
              Bật mục &quot;Ghi phiên&quot; cho host trong trang Hosts <em>trước khi</em> kết nối thì màn hình terminal
              mới được lưu. Bản ghi bị xoá tự động sau 7 ngày.
            </p>
          </div>
        ) : recordingQuery.isError ? (
          <div className='py-16 flex flex-col items-center gap-3 text-center'>
            <p className='text-sm font-semibold' style={{ color: 'var(--color-down)' }}>
              {recordingQuery.error instanceof Error ? recordingQuery.error.message : 'Không tải được bản ghi'}
            </p>
            <button
              onClick={() => recordingQuery.refetch()}
              className='px-4 py-2 rounded-xl text-sm font-bold cursor-pointer'
              style={{
                background: 'var(--color-bg)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div ref={containerRef} className='min-h-[280px]' />
        )}
      </div>

      <p className='text-xs' style={{ color: 'var(--color-muted)' }}>
        ⚠ Bản ghi lưu mọi gì hiển thị trên màn hình, gồm cả mật khẩu gõ vào (khi dùng sudo...). Xoá hoặc không bật ghi
        nếu bạn không cần.
      </p>
    </div>
  )
}
