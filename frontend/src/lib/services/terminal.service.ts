import { http } from '../axios'

// The ticket is single use and expires in 30 seconds, so ask for a new one on every connect.
export async function createTicket(hostId: string): Promise<string> {
  const { data } = await http.post<{ ticket: string }>('/terminal/tickets', { hostId })
  return data.ticket
}

export const terminalService = { createTicket }
