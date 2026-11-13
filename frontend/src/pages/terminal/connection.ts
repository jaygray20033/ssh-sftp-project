import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Terminal } from '@xterm/xterm'
import { terminalSocketUrl } from '@lib/terminal-url'
import { terminalService } from '@lib/services/terminal.service'
import type { TerminalClientMessage, TerminalHostKeyPrompt, TerminalServerMessage, TerminalTabStatus } from '@lib/types'
import type { TerminalTheme } from './store'
import { terminalTheme } from './themes'

const RESIZE_DEBOUNCE_MS = 100

const closeNotice: Record<number, string> = {
  4401: 'Không xác thực được ticket (hết hạn hoặc đã dùng).',
  4404: 'Không tìm thấy host này.',
  4408: 'Phiên đóng vì không có hoạt động.',
  4429: 'Đã đạt giới hạn số phiên mở cùng lúc.',
  4500: 'Server kết nối lỗi.'
}

export interface ConnectionNotice {
  code: string
  message: string
}

interface ConnectionEvents {
  onStatus: (status: TerminalTabStatus) => void
  onHostKey: (prompt: TerminalHostKeyPrompt | null) => void
  onNotice: (notice: ConnectionNotice | null) => void
}

export interface ConnectionPrefs {
  fontSize: number
  theme: TerminalTheme
}

export class TerminalConnection {
  readonly term: Terminal
  private readonly fit = new FitAddon()
  private ws: WebSocket | null = null
  private observer: ResizeObserver | null = null
  private resizeTimer: number | undefined
  private lastSize = { cols: 0, rows: 0 }
  private notice: ConnectionNotice | null = null
  private disposed = false

  constructor(
    private readonly hostId: string,
    private readonly events: ConnectionEvents,
    prefs: ConnectionPrefs
  ) {
    this.term = new Terminal({
      fontSize: prefs.fontSize,
      fontFamily: "'Cascadia Code', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      theme: terminalTheme(prefs.theme),
      cursorBlink: true,
      scrollback: 4000
    })

    this.term.loadAddon(this.fit)
    this.term.loadAddon(new WebLinksAddon((_event, uri) => window.open(uri, '_blank', 'noopener')))
    this.term.onData((data) => this.send({ type: 'input', data }))
    this.term.attachCustomKeyEventHandler((event) => this.onKey(event))
  }

  attach(container: HTMLElement): void {
    this.term.open(container)
    this.safeFit()

    this.observer = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer)
      this.resizeTimer = window.setTimeout(() => this.syncSize(), RESIZE_DEBOUNCE_MS)
    })
    this.observer.observe(container)

    this.connect()
  }

  connect(): void {
    if (this.disposed) return

    this.events.onStatus('connecting')
    this.setNotice(null)
    this.events.onHostKey(null)
    this.lastSize = { cols: 0, rows: 0 }

    terminalService
      .createTicket(this.hostId)
      .then((ticket) => {
        if (this.disposed) return
        this.openSocket(terminalSocketUrl(ticket))
      })
      .catch((error: unknown) => {
        if (this.disposed) return
        this.events.onStatus('error')
        this.setNotice({
          code: 'TICKET_FAILED',
          message: error instanceof Error ? error.message : 'Không lấy được ticket kết nối.'
        })
      })
  }

  applyPrefs(prefs: ConnectionPrefs): void {
    this.term.options.fontSize = prefs.fontSize
    this.term.options.theme = terminalTheme(prefs.theme)
    this.syncSize()
  }

  acceptHostKey(): void {
    this.events.onHostKey(null)
    this.setNotice({ code: 'HOST_KEY_SAVED', message: 'Đã tin tưởng host key, đang mở phiên...' })
    this.send({ type: 'hostkey_accept' })
  }

  rejectHostKey(): void {
    this.events.onHostKey(null)
    this.setNotice({ code: 'HOST_KEY_REJECTED', message: 'Bạn đã từ chối host key này.' })
    this.closeSocket()
    this.events.onStatus('closed')
  }

  fitNow(): void {
    this.safeFit()
    this.term.focus()
    this.syncSize()
  }

  /** Types text into the live shell like keystrokes (F07 snippets). Enter only when asked. */
  submitText(text: string, autoEnter: boolean): boolean {
    const sent = this.send({ type: 'input', data: text.trimEnd() + (autoEnter ? '\r' : '') })
    if (sent) this.term.focus()

    return sent
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true

    window.clearTimeout(this.resizeTimer)
    this.observer?.disconnect()
    this.observer = null

    this.closeSocket()
    this.term.dispose()
  }

  private openSocket(url: string): void {
    const ws = new WebSocket(url)
    this.ws = ws

    ws.onmessage = (event) => this.onMessage(event.data)
    ws.onerror = () => {
      if (this.disposed || ws.readyState === WebSocket.CLOSED) return
      this.setNotice({ code: 'SOCKET_ERROR', message: 'Mất kết nối WebSocket tới server.' })
    }
    ws.onclose = (event) => {
      if (this.disposed) return
      this.ws = null
      this.events.onStatus(event.code === 1000 ? 'closed' : 'error')
      // The server already told us what went wrong when it sent error or closed.
      if (!this.notice) {
        this.setNotice({ code: `CLOSE_${event.code}`, message: closeNotice[event.code] ?? 'Phiên đã đóng.' })
      }
    }
  }

  private onMessage(raw: unknown): void {
    if (typeof raw !== 'string') return

    let message: TerminalServerMessage
    try {
      message = JSON.parse(raw) as TerminalServerMessage
    } catch {
      return
    }

    switch (message.type) {
      case 'hostkey':
        this.events.onHostKey({ fingerprint: message.fingerprint, status: message.status })
        break
      case 'ready':
        this.events.onStatus('open')
        this.setNotice(null)
        this.syncSize()
        this.term.focus()
        break
      case 'data':
        this.term.write(message.data)
        break
      case 'error':
        this.events.onStatus('error')
        this.setNotice({ code: message.code, message: message.message })
        break
      case 'closed':
        this.events.onStatus('closed')
        this.setNotice({ code: 'CLOSED', message: message.reason })
        break
      case 'pong':
        break
    }
  }

  private setNotice(notice: ConnectionNotice | null): void {
    this.notice = notice
    this.events.onNotice(notice)
  }

  private closeSocket(): void {
    const ws = this.ws
    this.ws = null
    if (!ws) return

    ws.onmessage = null
    ws.onclose = null
    ws.onerror = null
    ws.onopen = null
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close()
  }

  private syncSize(): void {
    if (!this.safeFit()) return

    const { cols, rows } = this.term
    if (cols === this.lastSize.cols && rows === this.lastSize.rows) return

    // A size measured before the socket opened has to be retried once the session is ready.
    if (this.send({ type: 'resize', cols, rows })) this.lastSize = { cols, rows }
  }

  private safeFit(): boolean {
    try {
      this.fit.fit()
      return this.term.cols > 0 && this.term.rows > 0
    } catch {
      // A hidden or zero-sized container cannot be measured.
      return false
    }
  }

  private send(message: TerminalClientMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false
    this.ws.send(JSON.stringify(message))

    return true
  }

  private onKey(event: KeyboardEvent): boolean {
    if (event.type !== 'keydown' || !event.ctrlKey || !event.shiftKey || event.altKey) return true

    const key = event.key.toLowerCase()

    if (key === 'c') {
      const selection = this.term.getSelection()
      if (selection) void navigator.clipboard?.writeText(selection)
      return false
    }

    if (key === 'v') {
      void navigator.clipboard
        ?.readText()
        .then((text) => text && this.term.paste(text))
        .catch(() => undefined)
      return false
    }

    return true
  }
}
