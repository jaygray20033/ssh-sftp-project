import { http } from '../axios'
import type { PaginatedSnippets, Snippet } from '../types'

// B10 CRUD. The backend only stores commands — sending one to a terminal is
// done client-side like typed keystrokes, never server-executed.

export async function getSnippets(params: { limit?: number; offset?: number; search?: string } = {}) {
  const { data } = await http.get<{ snippets: PaginatedSnippets }>('/snippets', { params })
  return data.snippets
}

export async function createSnippet(body: { name: string; command: string; description?: string }) {
  const { data } = await http.post<{ snippet: Snippet }>('/snippets', body)
  return data.snippet
}

export async function deleteSnippet(id: string) {
  await http.delete(`/snippets/${id}`)
}

export const snippetsService = { getSnippets, createSnippet, deleteSnippet }
