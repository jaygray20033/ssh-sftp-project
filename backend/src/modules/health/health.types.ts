export type HealthStatus = 'healthy' | 'unhealthy'

export type DatabaseStatus = 'connected' | 'disconnected' | 'error'

export interface MemoryInfo {
  rss: string
  heapUsed: string
  heapTotal: string
}

export interface UptimeInfo {
  seconds: number
  formatted: string
}

export interface HealthCheck {
  status: HealthStatus
  uptime: UptimeInfo
  database: DatabaseStatus
  memory?: MemoryInfo
  timestamp: string
}
