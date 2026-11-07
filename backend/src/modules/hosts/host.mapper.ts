import type { Host } from '@entities/host.entity'

/**
 * The ONLY shape of a host that may leave the API.
 * Secrets are never included, only the `hasSecret` / `hasPassphrase` flags.
 */
export function toHostResponse(host: Host) {
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
    hostKeyFingerprint: host.hostKeyFingerprint,
    lastConnectedAt: host.lastConnectedAt,
    createdAt: host.createdAt,
    updatedAt: host.updatedAt
  }
}

export type HostResponse = ReturnType<typeof toHostResponse>
