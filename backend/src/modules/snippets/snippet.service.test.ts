import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictError, NotFoundError } from '@common/errors'

import type { Snippet } from '@entities/snippet.entity'

import { CreateSnippetBody, UpdateSnippetBody } from './dto'
import SnippetRepository from './snippet.repository'
import SnippetService from './snippet.service'

vi.mock('./snippet.repository', () => ({ default: { create: vi.fn(), update: vi.fn(), delete: vi.fn() } }))

// In-memory rows scoped by userId, like the host service tests.
const rows = new Map<string, Snippet>()
const makeRow = (partial: Partial<Snippet> = {}) =>
  ({
    id: 'snippet-1',
    userId: 'user-a',
    name: 'disk',
    command: 'df -h',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...partial
  }) as Snippet

vi.mocked(SnippetRepository.create).mockImplementation((data) => {
  const row = makeRow({ id: 'snippet-new', ...data })
  rows.set(row.id, row)
  return Promise.resolve(row)
})
vi.mocked(SnippetRepository.update).mockImplementation(async (id, userId, data) => {
  const row = rows.get(id)
  if (!row || row.userId !== userId) throw new NotFoundError('Snippet not found')
  Object.assign(row, data)
})
vi.mocked(SnippetRepository.delete).mockImplementation(async (id, userId) => {
  const row = rows.get(id)
  if (!row || row.userId !== userId) throw new NotFoundError('Snippet not found')
  rows.delete(id)
})
Object.assign(SnippetRepository, {
  findByIdAndUserId: (id: string, userId: string) => {
    const row = rows.get(id)
    return row && row.userId === userId ? row : undefined
  },
  findByUserIdAndName: (userId: string, name: string) =>
    [...rows.values()].find((row) => row.userId === userId && row.name === name),
  findAllByUserId: (userId: string) => {
    const entries = [...rows.values()]
      .filter((row) => row.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name))
    return Promise.resolve([entries, entries.length] as const)
  }
})

beforeEach(() => rows.clear())

const createBody: CreateSnippetBody = { name: 'disk', command: 'df -h' }

describe('SnippetService.createSnippet', () => {
  it('creates a snippet for the owner', async () => {
    const snippet = await SnippetService.createSnippet(createBody, 'user-a')
    expect(snippet).toMatchObject({ name: 'disk', command: 'df -h', description: null })
    expect(JSON.stringify(snippet)).not.toContain('user-a')
  })

  it('rejects a duplicate name for the same user', async () => {
    await SnippetService.createSnippet(createBody, 'user-a')
    await expect(SnippetService.createSnippet(createBody, 'user-a')).rejects.toBeInstanceOf(ConflictError)
    // Same name is fine for another user.
    await expect(SnippetService.createSnippet(createBody, 'user-b')).resolves.toBeDefined()
  })
})

describe('SnippetService.getSnippetById', () => {
  it('returns the snippet for its owner', async () => {
    rows.set('snippet-1', makeRow())
    await expect(SnippetService.getSnippetById('snippet-1', 'user-a')).resolves.toMatchObject({ id: 'snippet-1' })
  })

  it("returns 404 for another user's snippet", async () => {
    rows.set('snippet-1', makeRow())
    await expect(SnippetService.getSnippetById('snippet-1', 'user-b')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('SnippetService.updateSnippet', () => {
  it('updates only the given fields', async () => {
    rows.set('snippet-1', makeRow({ description: 'old' }))
    await SnippetService.updateSnippet('snippet-1', 'user-a', { command: 'df -h /' } satisfies UpdateSnippetBody)
    expect(rows.get('snippet-1')).toMatchObject({ command: 'df -h /', description: 'old' })
  })

  it('rejects renaming onto an existing name', async () => {
    rows.set('snippet-1', makeRow())
    rows.set('snippet-2', makeRow({ id: 'snippet-2', name: 'taken' }))
    await expect(
      SnippetService.updateSnippet('snippet-1', 'user-a', { name: 'taken' } satisfies UpdateSnippetBody)
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it("rejects updating another user's snippet", async () => {
    rows.set('snippet-1', makeRow())
    await expect(
      SnippetService.updateSnippet('snippet-1', 'user-b', { name: 'stolen' } satisfies UpdateSnippetBody)
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('SnippetService.deleteSnippet', () => {
  it('deletes the own snippet', async () => {
    rows.set('snippet-1', makeRow())
    await SnippetService.deleteSnippet('snippet-1', 'user-a')
    expect(rows.has('snippet-1')).toBe(false)
  })

  it("refuses to delete another user's snippet", async () => {
    rows.set('snippet-1', makeRow())
    await expect(SnippetService.deleteSnippet('snippet-1', 'user-b')).rejects.toBeInstanceOf(NotFoundError)
    expect(rows.has('snippet-1')).toBe(true)
  })
})

describe('SnippetService.getSnippets', () => {
  it('lists paginated snippets sorted by name', async () => {
    rows.set('s1', makeRow({ id: 's1', name: 'b' }))
    rows.set('s2', makeRow({ id: 's2', name: 'a', userId: 'user-b' }))
    const page = await SnippetService.getSnippets('user-a', { limit: 20, offset: 0 })
    expect(page.total_count).toBe(1)
    expect(page.entries[0].name).toBe('b')
    expect(JSON.stringify(page)).not.toContain('user-b')
  })
})
