import type { TerminalConnection } from './connection'

// Live terminal connections keyed by tab id, so the snippets panel can write
// into the active tab without prop-drilling refs.
const live = new Map<string, TerminalConnection>()

export function registerConnection(tabId: string, connection: TerminalConnection): void {
  live.set(tabId, connection)
}

export function unregisterConnection(tabId: string): void {
  live.delete(tabId)
}

export function getLiveConnection(tabId: string | null): TerminalConnection | null {
  return tabId ? (live.get(tabId) ?? null) : null
}
