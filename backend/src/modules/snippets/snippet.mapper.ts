import type { Snippet } from '@entities/snippet.entity'

/** The only shape of a snippet that may leave the API. */
export function toSnippetResponse(snippet: Snippet) {
  return {
    id: snippet.id,
    name: snippet.name,
    command: snippet.command,
    description: snippet.description,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt
  }
}

export type SnippetResponse = ReturnType<typeof toSnippetResponse>
