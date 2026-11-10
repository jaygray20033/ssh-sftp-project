import { BASE_URL } from './axios/config'

// The gateway reads the one-time ticket from the query string.
export function terminalSocketUrl(ticket: string): string {
  const api = new URL(BASE_URL, window.location.origin)
  const protocol = api.protocol === 'https:' ? 'wss:' : 'ws:'
  const path = `${api.pathname.replace(/\/+$/, '')}/terminal/ws`

  return `${protocol}//${api.host}${path}?ticket=${encodeURIComponent(ticket)}`
}
