import { useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import '@xterm/xterm/css/xterm.css'
import type { Host, TerminalHostKeyPrompt, TerminalTabStatus } from '@lib/types'
import { TerminalConnection, type ConnectionNotice } from '../connection'
import { HostKeyDialog } from './HostKeyDialog'
import { terminalSurface } from '../themes'
import { registerConnection, unregisterConnection } from '../registry'
import { useTerminalStore, type TerminalTab } from '../store'

const statusText: Record<TerminalTabStatus, string> = {
  connecting: 'Đang kết nối...',
  open: 'Đang mở',
  closed: 'Phiên đã đóng',
  error: 'Kết nối lỗi'
}

interface TerminalTabProps {
  tab: TerminalTab
  host: Host | undefined
  isActive: boolean
}

export function TerminalTabView({ tab, host, isActive }: TerminalTabProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const connectionRef = useRef<TerminalConnection | null>(null)
  const [hostKey, setHostKey] = useState<TerminalHostKeyPrompt | null>(null)
  const [notice, setNotice] = useState<ConnectionNotice | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  const setTabStatus = useTerminalStore((state) => state.setTabStatus)
  const fontSize = useTerminalStore((state) => state.fontSize)
  const theme = useTerminalStore((state) => state.theme)
  const surface = terminalSurface(theme)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const { fontSize: size, theme: name } = useTerminalStore.getState()
    const connection = new TerminalConnection(
      tab.hostId,
      {
        onStatus: (status) => setTabStatus(tab.id, status),
        onHostKey: setHostKey,
        onNotice: setNotice
      },
      { fontSize: size, theme: name }
    )

    connectionRef.current = connection
    connection.attach(container)
    registerConnection(tab.id, connection)

    return () => {
      unregisterConnection(tab.id)
      connectionRef.current = null
      connection.dispose()
    }
  }, [tab.id, tab.hostId, setTabStatus])

  useEffect(() => {
    connectionRef.current?.applyPrefs({ fontSize, theme })
  }, [fontSize, theme])

  useEffect(() => {
    if (!isActive) return
    const frame = requestAnimationFrame(() => connectionRef.current?.fitNow())
    return () => cancelAnimationFrame(frame)
  }, [isActive])

  useEffect(() => {
    if (!hostKey) setIsAccepting(false)
  }, [hostKey])

  const isBusy = tab.status === 'connecting'

  return (
    <div className='flex flex-col gap-3' style={{ display: isActive ? undefined : 'none' }}>
      {notice && (
        <div
          role='status'
          className='flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold'
          style={{
            background: tab.status === 'error' ? 'var(--color-down)' : 'var(--color-warning)',
            color: '#ffffff',
            border: '2px solid var(--text)',
            boxShadow: '2px 2px 0 var(--text)'
          }}
        >
          <span className='flex-1 min-w-40'>
            {notice.message}
            <span className='opacity-80 font-mono text-xs ml-2'>{notice.code}</span>
          </span>
          <button
            onClick={() => connectionRef.current?.connect()}
            className='flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer'
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '2px solid var(--text)'
            }}
          >
            <RefreshCw size={13} />
            Kết nối lại
          </button>
        </div>
      )}

      <div
        className='rounded-3xl p-2 sm:p-3'
        style={{ background: surface.background, border: '3px solid var(--text)', boxShadow: 'var(--clay-shadow-md)' }}
      >
        <div
          className='flex items-center gap-2 px-1 pb-2 text-xs font-bold uppercase tracking-wider'
          style={{ color: surface.muted }}
        >
          <span>{host ? `${host.username}@${host.hostname}:${host.port}` : tab.title}</span>
          <span className='flex-1' />
          {isBusy && <Loader2 size={13} className='animate-spin' />}
          <span>{statusText[tab.status]}</span>
        </div>
        <div ref={containerRef} className='terminal-host h-[min(58vh,520px)]' />
      </div>

      {hostKey && (
        <HostKeyDialog
          prompt={hostKey}
          hostLabel={host ? `${host.name} (${host.hostname}:${host.port})` : tab.title}
          isAccepting={isAccepting}
          onAccept={() => {
            setIsAccepting(true)
            connectionRef.current?.acceptHostKey()
          }}
          onReject={() => {
            setIsAccepting(false)
            connectionRef.current?.rejectHostKey()
          }}
        />
      )}
    </div>
  )
}
