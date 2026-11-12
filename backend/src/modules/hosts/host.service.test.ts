import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictError, NotFoundError } from '@common/errors'
import { CryptoService } from '@common/services'

import type { Host } from '@entities/host.entity'

import { CreateHostBody, UpdateHostBody } from './dto'
import HostRepository from './host.repository'
import HostService from './host.service'

vi.mock('./host.repository', () => ({ default: { update: vi.fn(), delete: vi.fn(), create: vi.fn() } }))

// The repository mock keeps one "row" per id in memory, scoped by userId.
const rows = new Map<string, Host>()
const makeRow = (partial: Partial<Host> = {}) =>
  ({
    id: 'host-1',
    userId: 'user-a',
    name: 'srv',
    hostname: 'example.com',
    port: 22,
    username: 'dev',
    authType: 'password',
    encryptedSecret: 'v1:old:old:old',
    encryptedPassphrase: null,
    hostKeyFingerprint: 'SHA256:stored',
    tags: ['web'],
    lastConnectedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...partial
  }) as Host

vi.mocked(HostRepository.create).mockImplementation((data) => {
  const row = makeRow({ id: 'host-new', hostKeyFingerprint: null, ...data })
  rows.set(row.id, row)
  return Promise.resolve(row)
})
vi.mocked(HostRepository.update).mockImplementation(async (id, userId, data) => {
  const row = rows.get(id)
  if (!row || row.userId !== userId) throw new NotFoundError('Host not found')
  Object.assign(row, data)
})
vi.mocked(HostRepository.delete).mockImplementation(async (id, userId) => {
  const row = rows.get(id)
  if (!row || row.userId !== userId) throw new NotFoundError('Host not found')
  rows.delete(id)
})
Object.assign(HostRepository, {
  findByIdAndUserId: (id: string, userId: string) => {
    const row = rows.get(id)
    return row && row.userId === userId ? row : undefined
  },
  findByUserIdAndName: (userId: string, name: string) =>
    [...rows.values()].find((row) => row.userId === userId && row.name === name),
  findAllByUserId: (userId: string) => {
    const entries = [...rows.values()].filter((row) => row.userId === userId)
    return Promise.resolve([entries, entries.length] as const)
  }
})

const seed = (partial: Partial<Host> = {}) => {
  const row = makeRow(partial)
  rows.set(row.id, row)
  return row
}

beforeEach(() => rows.clear())

const createBody: CreateHostBody = {
  name: 'prod',
  hostname: '203.0.113.10',
  port: 2222,
  username: 'root',
  authType: 'password',
  secret: 'hunter2',
  tags: ['prod']
}

describe('HostService.createHost', () => {
  it('encrypts the secret before storing it', async () => {
    await HostService.createHost(createBody, 'user-a')
    const row = rows.get('host-new')!
    expect(row.encryptedSecret.startsWith('v1:')).toBe(true)
    expect(CryptoService.decrypt(row.encryptedSecret)).toBe('hunter2')
  })

  it('never leaks the secret in the response', async () => {
    const json = JSON.stringify(await HostService.createHost(createBody, 'user-a'))
    expect(json).not.toContain('hunter2')
    expect(json).not.toContain('v1:')
  })

  it('encrypts the passphrase only for private keys', async () => {
    await HostService.createHost(
      { ...createBody, authType: 'private_key', secret: 'KEY', passphrase: 'phrase' },
      'user-a'
    )
    expect(CryptoService.decrypt(rows.get('host-new')!.encryptedPassphrase!)).toBe('phrase')

    await HostService.createHost({ ...createBody, name: 'prod2', authType: 'password', passphrase: 'phrase' }, 'user-a')
    expect(rows.get('host-new')!.encryptedPassphrase).toBeNull()
  })

  it('rejects a duplicate name for the same user', async () => {
    await HostService.createHost(createBody, 'user-a')
    await expect(HostService.createHost(createBody, 'user-a')).rejects.toBeInstanceOf(ConflictError)
    // Same name is fine for another user.
    await expect(HostService.createHost(createBody, 'user-b')).resolves.toBeDefined()
  })
})

describe('HostService.getHostById', () => {
  it('returns the host for its owner', async () => {
    seed()
    await expect(HostService.getHostById('host-1', 'user-a')).resolves.toMatchObject({ id: 'host-1' })
  })

  it("returns 404 for another user's host", async () => {
    seed()
    await expect(HostService.getHostById('host-1', 'user-b')).rejects.toBeInstanceOf(NotFoundError)
    await expect(HostService.getHostById('missing', 'user-a')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('HostService.updateHost', () => {
  it('keeps the stored secret when omitted', async () => {
    seed()
    await HostService.updateHost('host-1', 'user-a', { name: 'renamed' } satisfies UpdateHostBody)
    expect(rows.get('host-1')!.name).toBe('renamed')
    expect(rows.get('host-1')!.encryptedSecret).toBe('v1:old:old:old')
  })

  it('re-encrypts a new secret and clears the passphrase for passwords', async () => {
    seed({ authType: 'private_key', encryptedPassphrase: 'v1:p:p:p' })
    await HostService.updateHost('host-1', 'user-a', { secret: 'new-secret', authType: 'password' })
    const row = rows.get('host-1')!
    expect(CryptoService.decrypt(row.encryptedSecret)).toBe('new-secret')
    expect(row.encryptedPassphrase).toBeNull()
  })

  it('clears the trusted fingerprint when the server identity changes', async () => {
    seed()
    await HostService.updateHost('host-1', 'user-a', { hostname: '203.0.113.20' })
    expect(rows.get('host-1')!.hostKeyFingerprint).toBeNull()

    seed({ hostKeyFingerprint: 'SHA256:stored' })
    await HostService.updateHost('host-1', 'user-a', { port: 2200 })
    expect(rows.get('host-1')!.hostKeyFingerprint).toBeNull()
  })

  it('does not clear the fingerprint on unrelated changes', async () => {
    seed()
    await HostService.updateHost('host-1', 'user-a', { tags: ['new-tag'] })
    expect(rows.get('host-1')!.hostKeyFingerprint).toBe('SHA256:stored')
  })

  it('rejects updating a host of another user', async () => {
    seed()
    await expect(HostService.updateHost('host-1', 'user-b', { name: 'stolen' })).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('HostService.deleteHost', () => {
  it('deletes the own host', async () => {
    seed()
    await HostService.deleteHost('host-1', 'user-a')
    expect(rows.has('host-1')).toBe(false)
  })

  it("refuses to delete another user's host", async () => {
    seed()
    await expect(HostService.deleteHost('host-1', 'user-b')).rejects.toBeInstanceOf(NotFoundError)
    expect(rows.has('host-1')).toBe(true)
  })
})

describe('HostService.getHosts', () => {
  it('maps every host through toHostResponse (no secrets)', async () => {
    seed({ encryptedSecret: 'v1:aaa:bbb:ccc' })
    const page = await HostService.getHosts('user-a', { limit: 20, offset: 0 })
    expect(page.total_count).toBe(1)
    expect(JSON.stringify(page)).not.toContain('v1:')
    expect(page.entries[0]).toMatchObject({ hasSecret: true, name: 'srv' })
  })
})
