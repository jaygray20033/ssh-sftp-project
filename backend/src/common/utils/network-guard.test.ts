import dns from 'node:dns'

import { afterEach, describe, expect, it, vi } from 'vitest'

import env from '@common/config/env'

import { assertHostAllowed, isIpAllowed, resolveAllowedHostIp } from './network-guard'

type LookupResult = { address: string; family: number }

// The all:true overload is not the first type overload of lookup, so cast the mock.
const mockLookup = (result: LookupResult[]) => {
  vi.spyOn(dns.promises, 'lookup').mockResolvedValue(result as never)
}

describe('isIpAllowed', () => {
  it('blocks loopback, unspecified and broadcast', () => {
    for (const ip of ['127.0.0.1', '127.8.8.8', '0.0.0.0', '255.255.255.255', '::1', '::']) {
      expect(isIpAllowed(ip), ip).toBe(false)
    }
  })

  it('blocks private IPv4 ranges', () => {
    for (const ip of ['10.0.0.1', '10.255.255.255', '172.16.0.1', '172.31.255.255', '192.168.1.1', '100.64.0.1']) {
      expect(isIpAllowed(ip), ip).toBe(false)
    }
  })

  it('blocks link-local, especially the cloud metadata endpoint', () => {
    expect(isIpAllowed('169.254.0.1')).toBe(false)
    expect(isIpAllowed('169.254.169.254')).toBe(false)
  })

  it('blocks multicast and non-routable edges', () => {
    expect(isIpAllowed('224.0.0.1')).toBe(false)
    expect(isIpAllowed('239.255.255.255')).toBe(false)
  })

  it('allows public IPv4 addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '11.0.0.1']) {
      expect(isIpAllowed(ip), ip).toBe(true)
    }
  })

  it('blocks private and link-local IPv6', () => {
    for (const ip of ['fc00::1', 'fd12:3456:789a::1', 'fe80::1', 'febf::1']) {
      expect(isIpAllowed(ip), ip).toBe(false)
    }
  })

  it('allows global IPv6 addresses', () => {
    expect(isIpAllowed('2001:db8::1')).toBe(true)
    expect(isIpAllowed('2606:4700:4700::1111')).toBe(true)
  })

  it('judges IPv4-mapped IPv6 as plain IPv4', () => {
    expect(isIpAllowed('::ffff:127.0.0.1')).toBe(false)
    expect(isIpAllowed('::ffff:10.0.0.5')).toBe(false)
    expect(isIpAllowed('::ffff:8.8.8.8')).toBe(true)
  })

  it('rejects anything that is not an IP', () => {
    expect(isIpAllowed('example.com')).toBe(false)
    expect(isIpAllowed('')).toBe(false)
  })
})

describe('resolveAllowedHostIp', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    env.ALLOW_PRIVATE_HOSTS = true
  })

  it('returns public IPs after DNS lookup', async () => {
    env.ALLOW_PRIVATE_HOSTS = false
    mockLookup([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 }
    ])
    await expect(resolveAllowedHostIp('example.com')).resolves.toBe('93.184.216.34')
  })

  it('rejects hostnames that resolve to a private IP', async () => {
    env.ALLOW_PRIVATE_HOSTS = false
    mockLookup([{ address: '192.168.1.10', family: 4 }])
    await expect(resolveAllowedHostIp('intranet.example.com')).rejects.toThrow('not allowed')
  })

  it('rejects hostnames that resolve to loopback (DNS rebinding)', async () => {
    env.ALLOW_PRIVATE_HOSTS = false
    mockLookup([
      { address: '8.8.8.8', family: 4 },
      { address: '127.0.0.1', family: 4 }
    ])
    await expect(resolveAllowedHostIp('rebind.example.com')).resolves.toBe('8.8.8.8')
    mockLookup([{ address: '127.0.0.1', family: 4 }])
    await expect(resolveAllowedHostIp('rebind.example.com')).rejects.toThrow('not allowed')
  })

  it('rejects private IPs given literally', async () => {
    env.ALLOW_PRIVATE_HOSTS = false
    await expect(resolveAllowedHostIp('192.168.1.10')).rejects.toThrow('not allowed')
    await expect(resolveAllowedHostIp('8.8.8.8')).resolves.toBe('8.8.8.8')
  })

  it('rejects unresolvable hostnames', async () => {
    env.ALLOW_PRIVATE_HOSTS = false
    mockLookup([])
    await expect(resolveAllowedHostIp('missing.example.com')).rejects.toThrow('Could not resolve')
  })

  it('returns private IPs when ALLOW_PRIVATE_HOSTS=true', async () => {
    const original = env.ALLOW_PRIVATE_HOSTS
    env.ALLOW_PRIVATE_HOSTS = true
    try {
      mockLookup([{ address: '192.168.1.10', family: 4 }])
      await expect(resolveAllowedHostIp('intranet.example.com')).resolves.toBe('192.168.1.10')
    } finally {
      env.ALLOW_PRIVATE_HOSTS = original
    }
  })
})

describe('assertHostAllowed', () => {
  const restoreEnv = () => {
    env.ALLOW_PRIVATE_HOSTS = true
    env.ALLOWED_HOSTS = []
  }

  afterEach(restoreEnv)

  it('allows loopback in test mode (ALLOW_PRIVATE_HOSTS=true)', async () => {
    await expect(assertHostAllowed('127.0.0.1')).resolves.toBeUndefined()
  })

  it('rejects loopback when ALLOW_PRIVATE_HOSTS=false', async () => {
    env.ALLOW_PRIVATE_HOSTS = false
    await expect(assertHostAllowed('127.0.0.1')).rejects.toThrow('not allowed')
  })

  it('only allows hosts on the allowlist', async () => {
    env.ALLOWED_HOSTS = ['server1.example.com']
    await expect(assertHostAllowed('server1.example.com')).resolves.toBeUndefined()
    await expect(assertHostAllowed('SERVER1.EXAMPLE.COM')).resolves.toBeUndefined()
    await expect(assertHostAllowed('server2.example.com')).rejects.toThrow('not in the allowed list')
  })
})
