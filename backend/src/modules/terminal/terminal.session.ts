import { StringDecoder } from 'node:string_decoder'

import { Client, ClientChannel } from 'ssh2'
import { WebSocket } from 'ws'

import env from '@common/config/env'
import logger from '@common/config/logger'
import {
  SshErrorCode,
  TERMINAL_DEFAULT_COLS,
  TERMINAL_DEFAULT_ROWS,
  TERMINAL_HOST_KEY_TIMEOUT_MS,
  TERMINAL_PING_INTERVAL_MS,
  TERMINAL_TERM,
  TerminalCloseCode,
  TerminalErrorCode
} from '@common/constants'
import { NotFoundError } from '@common/errors'

import HostService from '@modules/hosts/host.service'
import SshService, { SshError } from '@modules/hosts/ssh.service'

import { Host } from '@entities/host.entity'

import { ClientMessage, ClientMessageSchema, HostKeyStatus, ServerMessage } from './terminal.protocol'

const isHostKeyPrompt = (err: unknown): err is SshError & { fingerprint: string } =>
  err instanceof SshError &&
  (err.code === SshErrorCode.HOST_KEY_UNVERIFIED || err.code === SshErrorCode.HOST_KEY_CHANGED) &&
  typeof err.fingerprint === 'string'

class TerminalSession {
  private static readonly sessionsByUser = new Map<string, Set<TerminalSession>>()

  private client?: Client
  private stream?: ClientChannel
  private closed = false
  private cols = TERMINAL_DEFAULT_COLS
  private rows = TERMINAL_DEFAULT_ROWS
  private alive = true
  private idleTimer?: NodeJS.Timeout
  private pingTimer?: NodeJS.Timeout
  private hostKeyTimer?: NodeJS.Timeout
  private hostKeyPrompt?: { accept: () => void; cancel: () => void }
  // A UTF-8 character can be split across two SSH packets.
  private readonly decoder = new StringDecoder('utf8')

  constructor(
    private readonly ws: WebSocket,
    private readonly userId: string,
    private readonly hostId: string
  ) {}

  static countFor(userId: string): number {
    return this.sessionsByUser.get(userId)?.size ?? 0
  }

  static closeAll(): void {
    for (const sessions of this.sessionsByUser.values()) {
      for (const session of [...sessions]) session.close('Server shutting down', TerminalCloseCode.NORMAL)
    }
  }

  async start(): Promise<void> {
    const sessions = TerminalSession.sessionsByUser.get(this.userId) ?? new Set<TerminalSession>()
    sessions.add(this)
    TerminalSession.sessionsByUser.set(this.userId, sessions)

    this.ws.on('message', (data) => this.onMessage(String(data)))
    this.ws.on('pong', () => (this.alive = true))
    this.ws.on('close', () => this.close('Client disconnected', TerminalCloseCode.NORMAL))
    this.ws.on('error', (err) => {
      logger.warn({ userId: this.userId, hostId: this.hostId, err: err.message }, 'Terminal WebSocket error')
      this.close('WebSocket error', TerminalCloseCode.SERVER_ERROR)
    })
    this.startPing()

    try {
      const host = await HostService.getOwnedHost(this.hostId, this.userId)
      if (this.closed) return

      const client = await this.connect(host)
      if (!client) return
      if (this.closed) {
        client.end()
        return
      }

      this.client = client
      client.on('error', (err) => {
        logger.warn({ userId: this.userId, hostId: this.hostId, err: err.message }, 'Terminal SSH error')
        this.close('SSH connection error', TerminalCloseCode.SERVER_ERROR)
      })
      client.on('close', () => this.close('SSH connection closed', TerminalCloseCode.NORMAL))
      this.openShell(client)
    } catch (err) {
      this.onStartError(err)
    }
  }

  private async connect(host: Host): Promise<Client | undefined> {
    try {
      return await SshService.connect(host)
    } catch (err) {
      if (!isHostKeyPrompt(err)) throw err

      const status: HostKeyStatus = err.code === SshErrorCode.HOST_KEY_CHANGED ? 'changed' : 'new'
      const accepted = await this.promptHostKey(err.fingerprint, status)
      if (!accepted) {
        if (!this.closed) this.fail(TerminalErrorCode.HOST_KEY_TIMEOUT, 'Host key confirmation timed out')
        return undefined
      }

      await HostService.trustHostKey(host.id, host.userId, err.fingerprint)
      host.hostKeyFingerprint = err.fingerprint
      return SshService.connect(host)
    }
  }

  private promptHostKey(fingerprint: string, status: HostKeyStatus): Promise<boolean> {
    return new Promise((resolve) => {
      const finish = (accepted: boolean) => {
        clearTimeout(this.hostKeyTimer)
        this.hostKeyPrompt = undefined
        resolve(accepted)
      }
      this.hostKeyPrompt = { accept: () => finish(true), cancel: () => finish(false) }
      this.hostKeyTimer = setTimeout(() => finish(false), TERMINAL_HOST_KEY_TIMEOUT_MS)
      this.send({ type: 'hostkey', fingerprint, status })
    })
  }

  private openShell(client: Client): void {
    client.shell({ term: TERMINAL_TERM, cols: this.cols, rows: this.rows }, (err, stream) => {
      if (this.closed) return
      if (err) {
        logger.warn({ userId: this.userId, hostId: this.hostId, err: err.message }, 'Could not open SSH shell')
        this.fail(TerminalErrorCode.SHELL_FAILED, 'Could not open shell')
        return
      }

      this.stream = stream
      const forward = (chunk: Buffer) => this.send({ type: 'data', data: this.decoder.write(chunk) })
      stream.on('data', forward)
      stream.stderr.on('data', forward)
      stream.on('close', () => this.close('SSH shell closed', TerminalCloseCode.NORMAL))
      stream.on('error', (streamErr: Error) => {
        logger.warn({ userId: this.userId, hostId: this.hostId, err: streamErr.message }, 'SSH shell error')
        this.close('SSH shell error', TerminalCloseCode.SERVER_ERROR)
      })

      this.resetIdleTimer()
      this.send({ type: 'ready' })
    })
  }

  private onMessage(raw: string): void {
    if (this.closed) return

    let message: ClientMessage
    try {
      message = ClientMessageSchema.parse(JSON.parse(raw))
    } catch {
      this.send({ type: 'error', code: TerminalErrorCode.INVALID_MESSAGE, message: 'Invalid message' })
      return
    }

    switch (message.type) {
      case 'input':
        if (this.stream) {
          this.stream.write(message.data)
          this.resetIdleTimer()
        }
        break
      case 'resize':
        this.cols = message.cols
        this.rows = message.rows
        this.stream?.setWindow(message.rows, message.cols, 0, 0)
        break
      case 'hostkey_accept':
        this.hostKeyPrompt?.accept()
        break
      case 'ping':
        this.send({ type: 'pong' })
        break
    }
  }

  private onStartError(err: unknown): void {
    if (this.closed) return
    if (err instanceof NotFoundError) {
      this.fail(TerminalErrorCode.HOST_NOT_FOUND, 'Host not found', TerminalCloseCode.HOST_NOT_FOUND)
      return
    }
    if (err instanceof SshError) {
      logger.warn({ userId: this.userId, hostId: this.hostId, code: err.code }, 'Terminal SSH failed')
      this.fail(err.code, err.message)
      return
    }
    logger.error({ userId: this.userId, hostId: this.hostId, err }, 'Terminal session failed')
    this.fail(TerminalErrorCode.INTERNAL_ERROR, 'Could not start terminal session', TerminalCloseCode.SERVER_ERROR)
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (!this.alive) {
        this.close('Connection lost', TerminalCloseCode.NORMAL)
        return
      }
      this.alive = false
      this.ws.ping()
    }, TERMINAL_PING_INTERVAL_MS)
  }

  private resetIdleTimer(): void {
    clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(
      () => this.close('Idle timeout', TerminalCloseCode.IDLE_TIMEOUT),
      env.SESSION_IDLE_TIMEOUT_MIN * 60_000
    )
  }

  private send(message: ServerMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message))
  }

  private fail(
    code: SshErrorCode | TerminalErrorCode,
    message: string,
    closeCode: number = TerminalCloseCode.NORMAL
  ): void {
    this.send({ type: 'error', code, message })
    this.close(message, closeCode)
  }

  private close(reason: string, code: number = TerminalCloseCode.NORMAL): void {
    if (this.closed) return
    this.closed = true

    this.hostKeyPrompt?.cancel()
    clearTimeout(this.idleTimer)
    clearTimeout(this.hostKeyTimer)
    clearInterval(this.pingTimer)

    const sessions = TerminalSession.sessionsByUser.get(this.userId)
    sessions?.delete(this)
    if (sessions?.size === 0) TerminalSession.sessionsByUser.delete(this.userId)

    this.stream?.removeAllListeners()
    this.stream?.stderr.removeAllListeners()
    this.stream?.on('error', () => {})
    if (this.client) {
      this.client.removeAllListeners()
      // ssh2 crashes the process on an unhandled 'error' event, so keep one while ending.
      this.client.on('error', () => {})
      this.client.end()
    }

    this.send({ type: 'closed', reason })
    this.ws.close(code, reason)
    logger.info({ userId: this.userId, hostId: this.hostId, reason }, 'Terminal session closed')
  }
}

export default TerminalSession
