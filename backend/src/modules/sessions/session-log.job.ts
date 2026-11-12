import logger from '@common/config/logger'
import { SESSION_LOG_RETENTION_JOB_INTERVAL_MS } from '@common/constants'

import SessionLogService from './session-log.service'

/**
 * Hourly retention job: deletes audit logs older than SESSION_LOG_RETENTION_DAYS.
 * Returns a stop function for graceful shutdown.
 */
export const startSessionLogRetentionJob = (): (() => void) => {
  const run = async () => {
    try {
      const deleted = await SessionLogService.purgeExpired()
      if (deleted > 0) logger.info(`Session log retention: deleted ${deleted} old entries`)
    } catch (err) {
      logger.error(err, 'Session log retention job failed')
    }
  }

  void run()
  const timer = setInterval(() => void run(), SESSION_LOG_RETENTION_JOB_INTERVAL_MS)
  return () => clearInterval(timer)
}
