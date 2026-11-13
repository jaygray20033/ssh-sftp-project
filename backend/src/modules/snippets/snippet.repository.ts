import { Snippet } from '@entities/snippet.entity'

import AppDataSource from '@databases/data-source'

import { ListSnippetsQuery } from './dto'

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`)

class SnippetRepository {
  // Every lookup is scoped by userId: a snippet of another user is simply "not found".
  static findByIdAndUserId(id: string, userId: string) {
    return this.repo.findOne({ where: { id, userId } })
  }

  static findByUserIdAndName(userId: string, name: string) {
    return this.repo.findOne({ where: { userId, name } })
  }

  static findAllByUserId(userId: string, query: ListSnippetsQuery) {
    const qb = this.repo.createQueryBuilder('snippet').where('snippet.userId = :userId', { userId })

    if (query.search) {
      qb.andWhere(
        `(snippet.name ILIKE :search ESCAPE '\\' OR snippet.command ILIKE :search ESCAPE '\\' OR snippet.description ILIKE :search ESCAPE '\\')`,
        { search: `%${escapeLike(query.search)}%` }
      )
    }

    return qb.orderBy('snippet.name', 'ASC').take(query.limit).skip(query.offset).getManyAndCount()
  }

  static create(data: Partial<Snippet>) {
    return this.repo.save(this.repo.create(data))
  }

  static async update(id: string, userId: string, data: Partial<Snippet>) {
    await this.repo.update({ id, userId }, data)
  }

  // Hard delete, like hosts.
  static async delete(id: string, userId: string) {
    await this.repo.delete({ id, userId })
  }

  private static get repo() {
    return AppDataSource.getDataSource().getRepository(Snippet)
  }
}

export default SnippetRepository
