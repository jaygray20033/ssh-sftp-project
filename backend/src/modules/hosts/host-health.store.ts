import NodeCache from 'node-cache'

import { HostStatus } from '@common/constants/host.constant'

export type HostHealth = {
  status: HostStatus
  lastCheckedAt: Date | null
}

// In-memory health state: no DB columns, resets to "unknown" on restart.
const store = new NodeCache({ useClones: false })

const initialHealth = (): HostHealth => ({ status: HostStatus.UNKNOWN, lastCheckedAt: null })

class HostHealthStore {
  static get(hostId: string): HostHealth {
    return store.get<HostHealth>(hostId) ?? initialHealth()
  }

  static set(hostId: string, ok: boolean): void {
    store.set(hostId, { status: ok ? HostStatus.UP : HostStatus.DOWN, lastCheckedAt: new Date() })
  }

  static clear(hostId: string): void {
    store.del(hostId)
  }
}

export default HostHealthStore
