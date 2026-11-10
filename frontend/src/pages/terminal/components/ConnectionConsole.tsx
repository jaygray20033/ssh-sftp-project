import { Loader2, Play, ShieldCheck, FolderOpen } from 'lucide-react'
import type { Host, TestHostResult } from '@lib/types'

const toneColor = {
  prompt: 'var(--ansi-magenta)',
  ok: 'var(--ansi-green)',
  err: 'var(--ansi-red)',
  warn: 'var(--ansi-amber)',
  key: 'var(--ansi-cyan)',
  dim: 'var(--console-muted)'
} as const

type Tone = keyof typeof toneColor
type Line = { tone: Tone; tag: string; text: string }

const isKeyPrompt = (result: TestHostResult) =>
  !result.ok && Boolean(result.fingerprint) && ['HOST_KEY_UNVERIFIED', 'HOST_KEY_CHANGED'].includes(result.code)

interface ConnectionConsoleProps {
  host: Host | null
  result: TestHostResult | null
  isTesting: boolean
  isTrusting: boolean
  onTest: () => void
  onTrust: (fingerprint: string) => void
  onOpenFiles: (hostId: string) => void
}

export function ConnectionConsole({
  host,
  result,
  isTesting,
  isTrusting,
  onTest,
  onTrust,
  onOpenFiles
}: ConnectionConsoleProps) {
  const lines: Line[] = []

  if (!host) {
    lines.push({ tone: 'dim', tag: '', text: 'Chọn một host để bắt đầu.' })
  } else {
    lines.push({ tone: 'prompt', tag: '$', text: `shelldeck test --host "${host.name}"` })
    lines.push({
      tone: 'dim',
      tag: '',
      text: `đích ${host.username}@${host.hostname}:${host.port} · ${host.authType === 'private_key' ? 'private key' : 'mật khẩu'}`
    })

    if (isTesting) {
      lines.push({ tone: 'warn', tag: '[...]', text: 'Đang kết nối tới host' })
    }

    if (result) {
      if (result.ok) {
        lines.push({ tone: 'ok', tag: '[OK]', text: `kết nối thành công · ${result.latencyMs} ms` })
        lines.push({
          tone: 'key',
          tag: '[KEY]',
          text: result.fingerprint ?? 'chưa lưu host key'
        })
      } else {
        lines.push({ tone: 'err', tag: '[ERR]', text: `${result.code} — ${result.message}` })
        if (result.fingerprint) {
          lines.push({ tone: 'key', tag: '[KEY]', text: `fingerprint mới: ${result.fingerprint}` })
        }
      }
    }
  }

  const showTrust = Boolean(host && result && !result.ok && isKeyPrompt(result))

  return (
    <div className='console-panel flex flex-col overflow-hidden'>
      <div
        className='flex items-center gap-2 px-4 py-2.5 shrink-0'
        style={{ borderBottom: '1px solid var(--console-border)', background: 'var(--console-surface)' }}
      >
        <span className='text-xs font-bold tracking-wider uppercase' style={{ color: 'var(--console-text)' }}>
          Kiểm tra kết nối
        </span>
        <span className='flex-1 min-w-0 truncate text-xs font-mono' style={{ color: 'var(--console-muted)' }}>
          {host ? `${host.username}@${host.hostname}:${host.port}` : 'chưa có phiên nào'}
        </span>
        {host && (
          <button
            onClick={() => onOpenFiles(host.id)}
            className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150'
            style={{
              background: 'var(--console-bg)',
              border: '1px solid var(--console-border)',
              color: 'var(--console-text)'
            }}
          >
            <FolderOpen size={13} />
            Files
          </button>
        )}
      </div>

      <div className='console-scroll flex-1 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed min-h-48'>
        {lines.map((line, index) => (
          <div key={index} className='flex gap-2'>
            <span className='w-12 shrink-0 font-bold' style={{ color: toneColor[line.tone] }}>
              {line.tag}
            </span>
            <span className='break-all' style={{ color: toneColor[line.tone] }}>
              {line.text}
            </span>
          </div>
        ))}
        {!isTesting && (
          <div className='flex gap-2 mt-1'>
            <span style={{ color: 'var(--ansi-magenta)' }}>$</span>
            <span className='console-caret' style={{ color: 'var(--console-text)' }}>
              ▊
            </span>
          </div>
        )}
      </div>

      <div
        className='flex flex-wrap items-center gap-2 px-4 py-3 shrink-0'
        style={{ borderTop: '1px solid var(--console-border)', background: 'var(--console-surface)' }}
      >
        <button
          onClick={onTest}
          disabled={!host || isTesting}
          className='flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50'
          style={{ background: 'var(--cta)', border: '2px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
        >
          {isTesting ? <Loader2 size={15} className='animate-spin' /> : <Play size={15} />}
          Kiểm tra kết nối
        </button>

        {showTrust && result && !result.ok && result.fingerprint && (
          <button
            onClick={() => onTrust(result.fingerprint as string)}
            disabled={isTrusting}
            className='flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50'
            style={{
              background: 'var(--secondary)',
              color: 'var(--text)',
              border: '2px solid var(--text)',
              boxShadow: '2px 2px 0 var(--text)'
            }}
          >
            <ShieldCheck size={15} />
            {isTrusting ? 'Đang lưu...' : 'Tin tưởng host key này'}
          </button>
        )}
      </div>
    </div>
  )
}
