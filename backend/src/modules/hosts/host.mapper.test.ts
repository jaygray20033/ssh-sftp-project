import { describe, expect, it } from 'vitest'

import type { Host } from '@entities/host.entity'

import { toHostResponse } from './host.mapper'

describe('toHostResponse', () => {
  const host = {
    id: 'id-1',
    name: 'srv',
    hostname: 'example.com',
    port: 22,
    username: 'root',
    authType: 'password',
    encryptedSecret: 'v1:aaa:bbb:ccc',
    encryptedPassphrase: null,
    hostKeyFingerprint: null,
    tags: null,
    lastConnectedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    userId: 'user-1'
  } as unknown as Host

  it('never exposes secret material', () => {
    const json = JSON.stringify(toHostResponse(host))
    expect(json).not.toContain('v1:aaa')
    expect(json).not.toContain('encrypted')
    expect(json).not.toContain('user-1')
  })

  it('exposes flags instead', () => {
    const res = toHostResponse(host)
    expect(res.hasSecret).toBe(true)
    expect(res.hasPassphrase).toBe(false)
    expect(res.tags).toEqual([])
  })
})
