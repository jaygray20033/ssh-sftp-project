import { Host } from '@entities/host.entity'

import AppDataSource from '@databases/data-source'

import { ListHostsQuery } from './dto'

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`)

class HostRepository {
  // Every lookup is scoped by userId: a host of another user is simply "not found".
  static findByIdAndUserId(id: string, userId: string) {
    return this.hostRepo.findOne({ where: { id, userId } })
  }

  static findByUserIdAndName(userId: string, name: string) {
    return this.hostRepo.findOne({ where: { userId, name } })
  }

  static findAllByUserId(userId: string, query: ListHostsQuery) {
    const qb = this.hostRepo.createQueryBuilder('host').where('host.userId = :userId', { userId })

    if (query.search) {
      qb.andWhere(`(host.name ILIKE :search ESCAPE '\\' OR host.hostname ILIKE :search ESCAPE '\\')`, {
        search: `%${escapeLike(query.search)}%`
      })
    }
    if (query.tag) {
      qb.andWhere(`:tag = ANY(string_to_array(host.tags, ','))`, { tag: query.tag })
    }

    return qb.orderBy('host.createdAt', 'DESC').take(query.limit).skip(query.offset).getManyAndCount()
  }

  static create(data: Partial<Host>) {
    return this.hostRepo.save(this.hostRepo.create(data))
  }

  static async update(id: string, userId: string, data: Partial<Host>) {
    await this.hostRepo.update({ id, userId }, data)
  }

  // Hard delete: encrypted credentials must not linger in soft-deleted rows.
  static async delete(id: string, userId: string) {
    await this.hostRepo.delete({ id, userId })
  }

  private static get hostRepo() {
    return AppDataSource.getDataSource().getRepository(Host)
  }
}

export default HostRepository
