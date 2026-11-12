import 'dotenv/config'

import env from '@common/config/env'
import logger from '@common/config/logger'

import { startSessionLogRetentionJob } from '@modules/sessions/session-log.job'
import SftpService from '@modules/sftp/sftp.service'
import { attachTerminalGateway, closeTerminalGateway } from '@modules/terminal/terminal.gateway'

import AppDataSource from '@databases/data-source'

import app from './app'

const bootstrap = async () => {
  const dataSource = await AppDataSource.connect()

  if (env.AUTO_MIGRATE) {
    const migrations = await dataSource.runMigrations()
    logger.info(`Migrations applied: ${migrations.length}`)
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server is running on port ${env.PORT}`)
  })

  attachTerminalGateway(server)
  const stopSessionLogRetentionJob = startSessionLogRetentionJob()

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`)

    stopSessionLogRetentionJob()
    await closeTerminalGateway()
    SftpService.closeAll()

    server.close(async () => {
      try {
        if (dataSource.isInitialized) {
          await dataSource.destroy()
          logger.info('Database connection closed')
        }
      } catch (err) {
        logger.error(err, 'Error closing database connection')
      }
      logger.info('Server closed')
      process.exit(0)
    })

    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server')
  process.exit(1)
})
