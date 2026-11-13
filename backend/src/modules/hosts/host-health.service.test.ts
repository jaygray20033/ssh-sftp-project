import net from 'node:net'
import { AddressInfo } from 'node:net'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { HostStatus } from '@common/constants/host.constant'

import type { Host } from '@entities/host.entity'

import HostHealthService from './host-health.service'
import HostHealthStore from './host-health.store'

vi.mock('./host.repository', () => ({ default: { findAll: vi.fn(async () => []) } }))

const makeHost = (port: number): Host =>
  ({
    id: 'host-1',
    userId: 'user-1',
    name: 'srv',
    hostname: '127.0.0.1',
    port,
    username: 'dev',
    authType: 'password',
    encryptedSecret: 'v1:x:x:x',
    encryptedPassphrase: null,
    hostKeyFingerprint: null,
    tags: null,
    lastConnectedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  }) as Host

describe('HostHealthService', () => {
  let server: net.Server
  let port: number

  beforeAll(async () => {
    server = net.createServer(() => {})
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('starts as unknown', () => {
    expect(HostHealthStore.get('host-1')).toEqual({ status: 'unknown', lastCheckedAt: null })
  })

  it('marks a listening port as up', async () => {
    await HostHealthService.checkHost(makeHost(port))
    const health = HostHealthStore.get('host-1')
    expect(health.status).toBe(HostStatus.UP)
    expect(health.lastCheckedAt).toBeInstanceOf(Date)
  })

  it('marks a closed port as down', async () => {
    await HostHealthService.checkHost(makeHost(port + 1))
    expect(HostHealthStore.get('host-1').status).toBe(HostStatus.DOWN)
  })

  it('records results from the SSH test endpoint', () => {
    HostHealthService.recordResult('host-2', false)
    expect(HostHealthStore.get('host-2')).toMatchObject({ status: 'down' })
    HostHealthService.recordResult('host-2', true)
    expect(HostHealthStore.get('host-2')).toMatchObject({ status: 'up' })
  })

  it('clears the entry when the host is deleted', () => {
    HostHealthService.clear('host-1')
    expect(HostHealthStore.get('host-1')).toEqual({ status: 'unknown', lastCheckedAt: null })
  })

  it('checkAll probes every host without failing on errors', async () => {
    // Repository mock returns no hosts; the cycle must still resolve.
    await expect(HostHealthService.checkAll()).resolves.toBeUndefined()
  })
})
