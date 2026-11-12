import { Request, Response } from 'express'

import { ListSessionsQuerySchema } from './dto'
import SessionLogService from './session-log.service'

class SessionController {
  static async getSessions(req: Request, res: Response) {
    const query = ListSessionsQuerySchema.parse(req.query)
    const sessions = await SessionLogService.getSessions(req.user!.id, query)
    return res.ok({ sessions }, { message: 'Session logs retrieved successfully' })
  }
}

export default SessionController
