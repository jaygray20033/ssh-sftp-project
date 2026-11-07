import path from 'node:path'

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

import env from '@common/config/env'
import logger from '@common/config/logger'

class AppDataSource {
  private static instance: DataSource

  private static getInstance(): DataSource {
    if (!AppDataSource.instance) {
      AppDataSource.instance = new DataSource({
        type: 'postgres',
        url: env.DATABASE_URL,
        ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
        entities: [path.join(__dirname, 'entities', '*.entity.{ts,js}')],
        migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
        synchronize: false,
        logging: false,
        namingStrategy: new SnakeNamingStrategy()
      })
    }

    return AppDataSource.instance
  }

  public static getDataSource(): DataSource {
    return AppDataSource.getInstance()
  }

  public static async connect(): Promise<DataSource> {
    const dataSource = AppDataSource.getInstance()

    if (!dataSource.isInitialized) {
      await dataSource.initialize()
      logger.info('Database connected')
    }

    return dataSource
  }
}

export default AppDataSource
