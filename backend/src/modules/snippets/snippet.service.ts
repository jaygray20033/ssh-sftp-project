import { ConflictError, NotFoundError } from '@common/errors'
import { Paginated } from '@common/types'

import { Snippet } from '@entities/snippet.entity'

import { CreateSnippetBody, ListSnippetsQuery, UpdateSnippetBody } from './dto'
import { SnippetResponse, toSnippetResponse } from './snippet.mapper'
import SnippetRepository from './snippet.repository'

class SnippetService {
  static async getSnippets(userId: string, query: ListSnippetsQuery): Promise<Paginated<SnippetResponse>> {
    const [snippets, total_count] = await SnippetRepository.findAllByUserId(userId, query)
    return { entries: snippets.map(toSnippetResponse), limit: query.limit, offset: query.offset, total_count }
  }

  static async getSnippetById(id: string, userId: string): Promise<SnippetResponse> {
    return toSnippetResponse(await this.getOwnedSnippet(id, userId))
  }

  static async createSnippet(dto: CreateSnippetBody, userId: string): Promise<SnippetResponse> {
    await this.assertNameAvailable(userId, dto.name)
    const snippet = await SnippetRepository.create({
      name: dto.name,
      command: dto.command,
      description: dto.description ?? null,
      userId
    })
    return toSnippetResponse(snippet)
  }

  static async updateSnippet(id: string, userId: string, dto: UpdateSnippetBody): Promise<SnippetResponse> {
    const current = await this.getOwnedSnippet(id, userId)
    if (dto.name !== undefined && dto.name !== current.name) await this.assertNameAvailable(userId, dto.name)

    const data: Partial<Snippet> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.command !== undefined) data.command = dto.command
    if (dto.description !== undefined) data.description = dto.description
    if (Object.keys(data).length > 0) await SnippetRepository.update(id, userId, data)
    return this.getSnippetById(id, userId)
  }

  static async deleteSnippet(id: string, userId: string) {
    await this.getOwnedSnippet(id, userId)
    await SnippetRepository.delete(id, userId)
  }

  static async getOwnedSnippet(id: string, userId: string): Promise<Snippet> {
    const snippet = await SnippetRepository.findByIdAndUserId(id, userId)
    if (!snippet) throw new NotFoundError('Snippet not found')
    return snippet
  }

  private static async assertNameAvailable(userId: string, name: string) {
    const existing = await SnippetRepository.findByUserIdAndName(userId, name)
    if (existing) throw new ConflictError('A snippet with this name already exists')
  }
}

export default SnippetService
