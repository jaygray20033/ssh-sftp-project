import { Server, utils } from 'ssh2'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Host } from '@entities/host.entity'

import SshService, { getFingerprint } from './ssh.service'

import type { AddressInfo } from 'node:net'

vi.mock('@common/services', () => ({ CryptoService: { decrypt: (value: string) => value } }))
vi.mock('./host.repository', () => ({ default: { update: vi.fn() } }))

// Tiny in-process SSH server: password "good" is accepted, `exec` always answers "ok".
let server: Server
let port: number

beforeAll(async () => {
  const { private: hostKey } = utils.generateKeyPairSync('ed25519')
  server = new Server({ hostKeys: [hostKey] }, (client) => {
    client.on('authentication', (ctx) => {
      if (ctx.method === 'password' && ctx.password === 'good') ctx.accept()
      else ctx.reject(['password'])
    })
    client.on('ready', () => {
      client.on('session', (accept) => {
        accept().on('exec', (acceptExec) => {
          const stream = acceptExec()
          stream.write('ok\n')
          stream.exit(0)
          stream.end()
        })
      })
    })
    client.on('error', () => {})
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
})

afterAll(() => {
  server.close()
})

const makeHost = (overrides: Partial<Host> = {}) =>
  ({
    id: 'host-1',
    userId: 'user-1',
    hostname: '127.0.0.1',
    port,
    username: 'dev',
    authType: 'password',
    encryptedSecret: 'good',
    encryptedPassphrase: null,
    hostKeyFingerprint: null,
    ...overrides
  }) as Host

describe('getFingerprint', () => {
  it('returns SHA256:<base64 without padding>', () => {
    expect(getFingerprint(Buffer.from('abc'))).toMatch(/^SHA256:[A-Za-z0-9+/]{43}$/)
  })
})

describe('SshService.testConnection', () => {
  it('reports HOST_KEY_UNVERIFIED with the fingerprint for a new host', async () => {
    const result = await SshService.testConnection(makeHost())
    expect(result).toMatchObject({ ok: false, code: 'HOST_KEY_UNVERIFIED' })
    const fingerprint = (result as { fingerprint: string }).fingerprint
    expect(fingerprint).toMatch(/^SHA256:/)
    expect(SshService.getSeenFingerprint('user-1', 'host-1')).toBe(fingerprint)
  })

  it('connects once the fingerprint is trusted', async () => {
    const first = await SshService.testConnection(makeHost())
    const fingerprint = (first as { fingerprint: string }).fingerprint
    const result = await SshService.testConnection(makeHost({ hostKeyFingerprint: fingerprint }))
    expect(result).toMatchObject({ ok: true, fingerprint })
  })

  it('reports HOST_KEY_CHANGED when the stored fingerprint differs', async () => {
    const stored = 'SHA256:' + 'A'.repeat(43)
    const result = await SshService.testConnection(makeHost({ hostKeyFingerprint: stored }))
    expect(result).toMatchObject({ ok: false, code: 'HOST_KEY_CHANGED' })
  })

  it('reports AUTH_FAILED for a wrong password', async () => {
    const first = await SshService.testConnection(makeHost())
    const fingerprint = (first as { fingerprint: string }).fingerprint
    const result = await SshService.testConnection(
      makeHost({ hostKeyFingerprint: fingerprint, encryptedSecret: 'wrong' })
    )
    expect(result).toMatchObject({ ok: false, code: 'AUTH_FAILED' })
  })

  it('reports REFUSED when nothing listens on the port', async () => {
    const result = await SshService.testConnection(makeHost({ port: 1 }))
    expect(result).toMatchObject({ ok: false, code: 'REFUSED' })
  })
})
