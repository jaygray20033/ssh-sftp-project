import { once } from 'node:events'
import http from 'node:http'

import { Server, utils } from 'ssh2'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'

import env from '@common/config/env'
import { TERMINAL_WS_PATH, TerminalCloseCode, TerminalErrorCode } from '@common/constants'
import { NotFoundError } from '@common/errors'

import type { HostResponse } from '@modules/hosts/host.mapper'
import HostService from '@modules/hosts/host.service'
import { getFingerprint } from '@modules/hosts/ssh.service'

import type { Host } from '@entities/host.entity'

import { attachTerminalGateway, closeTerminalGateway } from './terminal.gateway'
import TerminalSession from './terminal.session'
import TicketService from './ticket.service'

import type { ServerMessage } from './terminal.protocol'
import type { AddressInfo } from 'node:net'

vi.mock('@common/services', () => ({ CryptoService: { decrypt: (value: string) => value } }))
vi.mock('@modules/hosts/host.repository', () => ({ default: { update: vi.fn() } }))
vi.mock('@modules/hosts/host.service', () => ({ default: { getOwnedHost: vi.fn(), trustHostKey: vi.fn() } }))
vi.mock('@modules/sessions/session-log.service', () => ({
  default: { open: vi.fn(async () => ({ id: 'log-1' })), close: vi.fn(async () => {}) }
}))

const ORIGIN = 'http://localhost:3000'
const USER_ID = 'user-1'
const HOST_ID = 'host-1'

let sshServer: Server
let sshPort: number
let fingerprint: string
let httpServer: http.Server
let wsPort: number

let openChannels = 0
let ptyInfo: { term: string; rows: number; cols: number } | undefined
let windowInfo: { rows: number; cols: number } | undefined

const clients: WebSocket[] = []

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async <T>(check: () => T | false | undefined, timeoutMs = 5000): Promise<T> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const result = check()
    if (result) return result
    await delay(20)
  }
  throw new Error('Timed out waiting for condition')
}

const wsUrl = (path = TERMINAL_WS_PATH) => `ws://127.0.0.1:${wsPort}${path}`

const track = (ws: WebSocket) => {
  clients.push(ws)
  ws.on('error', () => {})
  let code: number | undefined
  ws.on('close', (closeCode) => (code = closeCode))
  return { ws, closeCode: () => code }
}

const connect = async (ticket: string, origin = ORIGIN) => {
  const socket = track(new WebSocket(`${wsUrl()}?ticket=${ticket}`, { origin }))
  const messages: ServerMessage[] = []
  socket.ws.on('message', (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage))
  await once(socket.ws, 'open')
  return { ...socket, messages }
}

const send = (ws: WebSocket, message: Record<string, unknown>) => ws.send(JSON.stringify(message))

const output = (messages: ServerMessage[]) => messages.map((m) => (m.type === 'data' ? m.data : '')).join('')

const ready = (messages: ServerMessage[]) => waitFor(() => messages.some((m) => m.type === 'ready'))

const makeHost = (overrides: Partial<Host> = {}) =>
  ({
    id: HOST_ID,
    userId: USER_ID,
    hostname: '127.0.0.1',
    port: sshPort,
    username: 'dev',
    authType: 'password',
    encryptedSecret: 'dev',
    encryptedPassphrase: null,
    hostKeyFingerprint: fingerprint,
    ...overrides
  }) as Host

// Minimal shell: answers `echo <text>` and counts channels so tests can assert SSH cleanup.
beforeAll(async () => {
  const { private: hostKey, public: hostPublicKey } = utils.generateKeyPairSync('ed25519')
  const parsed = utils.parseKey(hostPublicKey)
  if (parsed instanceof Error) throw parsed
  fingerprint = getFingerprint(parsed.getPublicSSH())

  sshServer = new Server({ hostKeys: [hostKey] }, (client) => {
    client.on('authentication', (ctx) => {
      if (ctx.method === 'password' && ctx.password === 'dev') ctx.accept()
      else ctx.reject(['password'])
    })
    client.on('ready', () => {
      client.on('session', (accept) => {
        const session = accept()
        session.on('pty', (acceptPty, _reject, info) => {
          ptyInfo = info
          acceptPty()
        })
        session.on('window-change', (_accept, _reject, info) => {
          windowInfo = info
        })
        session.on('shell', (acceptShell) => {
          const channel = acceptShell()
          openChannels += 1
          channel.write('$ ')
          let buffer = ''
          channel.on('data', (chunk: Buffer) => {
            buffer += chunk.toString('utf8').replace(/\r\n?/g, '\n')
            let newline = buffer.indexOf('\n')
            while (newline !== -1) {
              const line = buffer.slice(0, newline).trim()
              buffer = buffer.slice(newline + 1)
              if (line === 'exit') {
                channel.exit(0)
                channel.end()
                return
              }
              if (line) channel.write(line.startsWith('echo ') ? `${line.slice(5)}\n` : `${line}: command not found\n`)
              channel.write('$ ')
              newline = buffer.indexOf('\n')
            }
          })
          channel.on('close', () => {
            openChannels -= 1
          })
          channel.on('error', () => {})
        })
      })
    })
    client.on('error', () => {})
  })
  await new Promise<void>((resolve) => sshServer.listen(0, '127.0.0.1', resolve))
  sshPort = (sshServer.address() as AddressInfo).port

  httpServer = http.createServer((_req, res) => {
    res.writeHead(404)
    res.end()
  })
  attachTerminalGateway(httpServer)
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
  wsPort = (httpServer.address() as AddressInfo).port
})

beforeEach(() => {
  openChannels = 0
  ptyInfo = undefined
  windowInfo = undefined
  vi.mocked(HostService.getOwnedHost).mockImplementation(async (id, userId) => {
    if (id !== HOST_ID || userId !== USER_ID) throw new NotFoundError('Host not found')
    return makeHost()
  })
  vi.mocked(HostService.trustHostKey).mockResolvedValue({} as HostResponse)
})

afterEach(async () => {
  for (const ws of clients) ws.terminate()
  clients.length = 0
  TerminalSession.closeAll()
  await delay(50)
  vi.clearAllMocks()
})

afterAll(async () => {
  await closeTerminalGateway()
  await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  sshServer.close()
})

describe('terminal gateway', () => {
  it('rejects another path with 404', async () => {
    const { ws } = track(new WebSocket(wsUrl('/api/v1/nope'), { origin: ORIGIN }))
    const [, response] = await once(ws, 'unexpected-response')
    expect(response.statusCode).toBe(404)
  })

  it('closes with 4401 when the ticket is missing', async () => {
    const { closeCode } = track(new WebSocket(wsUrl(), { origin: ORIGIN }))
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.UNAUTHORIZED)
  })

  it('closes with 4401 when the ticket is unknown', async () => {
    const { closeCode } = track(new WebSocket(`${wsUrl()}?ticket=${'f'.repeat(64)}`, { origin: ORIGIN }))
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.UNAUTHORIZED)
  })

  it('closes with 4401 when the origin is not allowed', async () => {
    const ticket = TicketService.issue(USER_ID, HOST_ID)
    const { closeCode } = track(new WebSocket(`${wsUrl()}?ticket=${ticket}`, { origin: 'http://evil.test' }))
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.UNAUTHORIZED)
  })

  it('closes with 4401 when the ticket is replayed', async () => {
    const ticket = TicketService.issue(USER_ID, HOST_ID)
    const { ws, messages } = await connect(ticket)
    await ready(messages)
    ws.close()
    await waitFor(() => openChannels === 0)

    const { closeCode } = track(new WebSocket(`${wsUrl()}?ticket=${ticket}`, { origin: ORIGIN }))
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.UNAUTHORIZED)
  })

  it('closes with 4404 when the host is not owned by the ticket user', async () => {
    const { messages, closeCode } = await connect(TicketService.issue('user-2', HOST_ID))
    expect(await waitFor(() => messages.find((m) => m.type === 'error'))).toMatchObject({
      code: TerminalErrorCode.HOST_NOT_FOUND
    })
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.HOST_NOT_FOUND)
    expect(openChannels).toBe(0)
  })

  it('asks to trust a new host key, then runs the shell both ways', async () => {
    vi.mocked(HostService.getOwnedHost).mockResolvedValue(makeHost({ hostKeyFingerprint: null }))
    const { ws, messages } = await connect(TicketService.issue(USER_ID, HOST_ID))

    const hostkey = await waitFor(() => messages.find((m) => m.type === 'hostkey'))
    expect(hostkey).toEqual({ type: 'hostkey', fingerprint, status: 'new' })
    expect(messages.some((m) => m.type === 'ready')).toBe(false)

    send(ws, { type: 'hostkey_accept' })
    await ready(messages)
    expect(HostService.trustHostKey).toHaveBeenCalledWith(HOST_ID, USER_ID, fingerprint)
    expect(ptyInfo?.term).toBe('xterm-256color')

    send(ws, { type: 'input', data: 'echo hi\r' })
    await waitFor(() => output(messages).includes('hi\n'))

    send(ws, { type: 'resize', cols: 120, rows: 40 })
    await waitFor(() => windowInfo?.cols === 120 && windowInfo.rows === 40)

    send(ws, { type: 'ping' })
    await waitFor(() => messages.some((m) => m.type === 'pong'))

    ws.close()
    await waitFor(() => openChannels === 0)
    expect(TerminalSession.countFor(USER_ID)).toBe(0)
  })

  it('opens the shell directly when the host key is already trusted', async () => {
    const { ws, messages } = await connect(TicketService.issue(USER_ID, HOST_ID))
    await ready(messages)
    expect(messages.some((m) => m.type === 'hostkey')).toBe(false)

    send(ws, { type: 'input', data: 'echo hi\r' })
    await waitFor(() => output(messages).includes('hi\n'))
  })

  it('reports a changed host key and waits for a decision', async () => {
    vi.mocked(HostService.getOwnedHost).mockResolvedValue(makeHost({ hostKeyFingerprint: `SHA256:${'A'.repeat(43)}` }))
    const { ws, messages } = await connect(TicketService.issue(USER_ID, HOST_ID))

    expect(await waitFor(() => messages.find((m) => m.type === 'hostkey'))).toEqual({
      type: 'hostkey',
      fingerprint,
      status: 'changed'
    })

    ws.close()
    await delay(50)
    expect(HostService.trustHostKey).not.toHaveBeenCalled()
    expect(messages.some((m) => m.type === 'ready')).toBe(false)
    expect(TerminalSession.countFor(USER_ID)).toBe(0)
  })

  it('ends the SSH session when the remote shell exits', async () => {
    const { ws, messages, closeCode } = await connect(TicketService.issue(USER_ID, HOST_ID))
    await ready(messages)
    send(ws, { type: 'input', data: 'exit\r' })

    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.NORMAL)
    expect(messages.some((m) => m.type === 'closed')).toBe(true)
    await waitFor(() => openChannels === 0)
    expect(TerminalSession.countFor(USER_ID)).toBe(0)
  })

  it('limits the number of sessions per user', async () => {
    for (let i = 0; i < env.MAX_SESSIONS_PER_USER; i += 1) {
      const { messages } = await connect(TicketService.issue(USER_ID, HOST_ID))
      await ready(messages)
    }
    expect(TerminalSession.countFor(USER_ID)).toBe(env.MAX_SESSIONS_PER_USER)

    const ticket = TicketService.issue(USER_ID, HOST_ID)
    const { closeCode } = track(new WebSocket(`${wsUrl()}?ticket=${ticket}`, { origin: ORIGIN }))
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.SESSION_LIMIT)
  })

  it('closes a message bigger than 64KB', async () => {
    const { ws, messages, closeCode } = await connect(TicketService.issue(USER_ID, HOST_ID))
    await ready(messages)

    send(ws, { type: 'input', data: 'x'.repeat(70 * 1024) })
    expect(await waitFor(closeCode)).toBe(1009)
  })

  it('answers an invalid message with an error and keeps the session', async () => {
    const { ws, messages } = await connect(TicketService.issue(USER_ID, HOST_ID))
    await ready(messages)

    ws.send('not json')
    expect(await waitFor(() => messages.find((m) => m.type === 'error'))).toMatchObject({
      code: TerminalErrorCode.INVALID_MESSAGE
    })
    expect(ws.readyState).toBe(WebSocket.OPEN)
  })

  it('reports SSH authentication failures without leaking the secret', async () => {
    vi.mocked(HostService.getOwnedHost).mockResolvedValue(makeHost({ encryptedSecret: 'wrong' }))
    const { messages, closeCode } = await connect(TicketService.issue(USER_ID, HOST_ID))

    expect(await waitFor(() => messages.find((m) => m.type === 'error'))).toMatchObject({ code: 'AUTH_FAILED' })
    expect(await waitFor(closeCode)).toBe(TerminalCloseCode.NORMAL)
    expect(JSON.stringify(messages)).not.toContain('wrong')
    expect(TerminalSession.countFor(USER_ID)).toBe(0)
  })
})
