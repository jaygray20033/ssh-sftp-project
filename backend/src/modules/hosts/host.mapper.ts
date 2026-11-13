import type { Host } from '@entities/host.entity'

import HostHealthStore from './host-health.store'

/**
 * The ONLY shape of a host that may leave the API.
 * Secrets are never included, only the `hasSecret` / `hasPassphrase` flags.
 */
export function toHostResponse(host: Host) {
  const health = HostHealthStore.get(host.id)
  return {
    id: host.id,
    name: host.name,
    hostname: host.hostname,
    port: host.port,
    username: host.username,
    authType: host.authType,
    tags: host.tags ?? [],
    hasSecret: Boolean(host.encryptedSecret),
    hasPassphrase: Boolean(host.encryptedPassphrase),
    // In-memory TCP health (B09); "unknown" until the first check.
    status: health.status,
    lastCheckedAt: health.lastCheckedAt,
    hostKeyFingerprint: host.hostKeyFingerprint,
    lastConnectedAt: host.lastConnectedAt,
    createdAt: host.createdAt,
    updatedAt: host.updatedAt
  }
}

export type HostResponse = ReturnType<typeof toHostResponse>
