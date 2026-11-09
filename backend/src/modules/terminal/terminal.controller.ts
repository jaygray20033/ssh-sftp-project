import { Request, Response } from 'express'

import { CreateTicketBody } from './dto'
import TerminalService from './terminal.service'

class TerminalController {
  static async createTicket(req: Request, res: Response) {
    const { hostId } = req.body as CreateTicketBody
    const ticket = await TerminalService.createTicket(req.user!.id, hostId)
    return res.created({ ticket }, { message: 'Terminal ticket created successfully' })
  }
}

export default TerminalController
