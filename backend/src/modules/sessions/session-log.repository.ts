import { SessionLog } from '@entities/session-log.entity'

import AppDataSource from '@databases/data-source'

class SessionLogRepository {
  static create(data: Partial<SessionLog>) {
    return this.repo.save(this.repo.create(data))
  }

  static async close(id: string, endedAt: Date, closeReason: string) {
    await this.repo.update({ id }, { endedAt, closeReason })
  }

  static listByUserId(userId: string, limit: number, offset: number) {
    return this.repo
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .orderBy('log.startedAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount()
  }

  static deleteStartedBefore(date: Date) {
    return this.repo.createQueryBuilder().delete().where('startedAt < :date', { date }).execute()
  }

  private static get repo() {
    return AppDataSource.getDataSource().getRepository(SessionLog)
  }
}

export default SessionLogRepository
