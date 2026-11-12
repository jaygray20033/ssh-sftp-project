import dns from 'node:dns'
import net from 'node:net'

import env from '@common/config/env'
import { BadRequestError } from '@common/errors'

// Targets the API must never reach by default (SSRF guard).
const BLOCKED_IPV4 = [
  { start: [0, 0, 0, 0], end: [0, 255, 255, 255] }, // "this network"
  { start: [10, 0, 0, 0], end: [10, 255, 255, 255] }, // private
  { start: [100, 64, 0, 0], end: [100, 127, 255, 255] }, // CGNAT
  { start: [127, 0, 0, 0], end: [127, 255, 255, 255] }, // loopback
  { start: [169, 254, 0, 0], end: [169, 254, 255, 255] }, // link-local (incl. 169.254.169.254)
  { start: [172, 16, 0, 0], end: [172, 31, 255, 255] }, // private
  { start: [192, 168, 0, 0], end: [192, 168, 255, 255] }, // private
  { start: [224, 0, 0, 0], end: [239, 255, 255, 255] }, // multicast
  { start: [255, 255, 255, 255], end: [255, 255, 255, 255] } // broadcast
]

export class HostNotAllowedError extends BadRequestError {}

// IPv4-mapped IPv6 (::ffff:127.0.0.1) must be judged as plain IPv4.
const toIpv4 = (ip: string): string | null => {
  const match = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
  return match ? match[1] : null
}

const isBlockedIpv4 = (ip: string): boolean => {
  const octets = ip.split('.').map(Number)
  for (const range of BLOCKED_IPV4) {
    if (range.start.every((_, i) => octets[i] >= range.start[i] && octets[i] <= range.end[i])) return true
  }
  return false
}

const isBlockedIpv6 = (ip: string): boolean => {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true // unspecified / loopback
  // Unique local addresses (fc00::/7) and link-local (fe80::/10).
  return /^f[cd][0-9a-f]{2}:/.test(lower) || /^fe[89ab][0-9a-f]:/.test(lower)
}

/** Pure check for one IP address — the DNS-free part of the guard. */
export const isIpAllowed = (ip: string): boolean => {
  if (net.isIP(ip) === 0) return false
  const ipv4 = toIpv4(ip) ?? (net.isIP(ip) === 4 ? ip : null)
  return ipv4 ? !isBlockedIpv4(ipv4) : !isBlockedIpv6(ip)
}

export class UnresolvedHostError extends BadRequestError {
  constructor(hostname: string) {
    super(`Could not resolve "${hostname}"`)
  }
}

/**
 * Resolves the hostname and returns the first allowed IP, which the caller must
 * connect to (protects against DNS rebinding). Throws when nothing is allowed.
 */
export const resolveAllowedHostIp = async (hostname: string): Promise<string> => {
  if (net.isIP(hostname)) {
    // Literal IP: still subject to the private-range checks.
    if (!env.ALLOW_PRIVATE_HOSTS && !isIpAllowed(hostname)) throw new HostNotAllowedError('This host is not allowed')
    return hostname
  }

  const addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0) throw new UnresolvedHostError(hostname)

  const allowed = addresses.find((address) =>
    env.ALLOW_PRIVATE_HOSTS ? net.isIP(address.address) !== 0 : isIpAllowed(address.address)
  )
  if (!allowed) throw new HostNotAllowedError('This host is not allowed')
  return allowed.address
}

/** Resolve + reject private/loopback targets (no-op when ALLOW_PRIVATE_HOSTS=true). */
export const assertHostAllowed = async (hostname: string): Promise<void> => {
  // Allowlist wins: when set, only these exact hostnames may be used.
  if (env.ALLOWED_HOSTS.length > 0) {
    const normalized = hostname.toLowerCase()
    if (!env.ALLOWED_HOSTS.some((allowed) => allowed.toLowerCase() === normalized)) {
      throw new HostNotAllowedError('This host is not in the allowed list')
    }
    return
  }

  if (env.ALLOW_PRIVATE_HOSTS) return
  await resolveAllowedHostIp(hostname)
}
