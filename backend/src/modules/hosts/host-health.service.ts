import net from 'node:net'

import env from '@common/config/env'
import logger from '@common/config/logger'
import { HOST_HEALTH_TCP_TIMEOUT_MS } from '@common/constants/host.constant'
import { resolveAllowedHostIp } from '@common/utils/network-guard'

import { Host } from '@entities/host.entity'

import HostHealthStore from './host-health.store'
import HostRepository from './host.repository'

/** One TCP dial to the SSH port: connected → up, anything else → down. */
const probe = (ip: string, port: number): Promise<number> =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const socket = net.connect({ host: ip, port })
    const done = (err?: Error) => {
      socket.destroy()
      if (err) reject(err)
      else resolve(Date.now() - startedAt)
    }
    socket.setTimeout(HOST_HEALTH_TCP_TIMEOUT_MS, () => done(new Error('timeout')))
    socket.once('connect', () => done())
    socket.once('error', (err) => done(err))
  })

class HostHealthService {
  /** Called by the SSH test endpoint: a successful test implies a working SSH port. */
  static recordResult(hostId: string, ok: boolean): void {
    const previous = HostHealthStore.get(hostId).status
    HostHealthStore.set(hostId, ok)
    if (previous !== HostHealthStore.get(hostId).status) {
      logger.info({ hostId, status: HostHealthStore.get(hostId).status }, 'Host status changed')
    }
  }

  static clear(hostId: string): void {
    HostHealthStore.clear(hostId)
  }

  static async checkHost(host: Host): Promise<void> {
    try {
      // Same SSRF guard as real connections; guard failure simply means "down".
      const ip = await resolveAllowedHostIp(host.hostname)
      await probe(ip, host.port)
      this.recordResult(host.id, true)
    } catch {
      this.recordResult(host.id, false)
    }
  }

  static async checkAll(): Promise<void> {
    const hosts = await HostRepository.findAll()
    await Promise.allSettled(hosts.map((host) => this.checkHost(host)))
  }

  /** Periodic job for every stored host. Returns a stop function for shutdown. */
  static startJob(): () => void {
    const intervalMs = env.HOST_HEALTH_CHECK_INTERVAL_SEC * 1000
    const run = () => {
      void this.checkAll().catch((err) => logger.error(err, 'Host health check cycle failed'))
    }

    const timer = setInterval(run, intervalMs)
    timer.unref()
    // First cycle shortly after boot, so the dashboard is not stuck on "unknown".
    const first = setTimeout(run, 5_000)
    first.unref()

    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }
}

export default HostHealthService
