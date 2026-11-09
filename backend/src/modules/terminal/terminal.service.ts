import HostService from '@modules/hosts/host.service'

import TicketService from './ticket.service'

class TerminalService {
  static async createTicket(userId: string, hostId: string): Promise<string> {
    await HostService.getOwnedHost(hostId, userId)
    return TicketService.issue(userId, hostId)
  }
}

export default TerminalService
