import { NextFunction, Request, Response } from 'express'

import { NotFoundError } from '@common/errors'

import { ListSessionsQuerySchema } from './dto'
import RecordingService from './recording.service'
import SessionLogService from './session-log.service'

class SessionController {
  static async getSessions(req: Request, res: Response) {
    const query = ListSessionsQuerySchema.parse(req.query)
    const sessions = await SessionLogService.getSessions(req.user!.id, query)
    return res.ok({ sessions }, { message: 'Session logs retrieved successfully' })
  }

  /** Streams the asciicast v2 recording of an own session (B11). */
  static async getRecording(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id as string
    const log = await SessionLogService.getOwnedLog(id, req.user!.id)
    const recording = RecordingService.openRead(log.id)
    if (!recording) throw new NotFoundError('No recording for this session')

    res.setHeader('Content-Type', 'text/x-asciicast; charset=utf-8')
    res.setHeader('Content-Length', String(recording.size))
    res.setHeader('Content-Disposition', `attachment; filename="session-${id}.cast"`)
    recording.stream.pipe(res)
    recording.stream.on('error', (err) => {
      if (res.headersSent) res.destroy()
      else next(err)
    })
  }
}

export default SessionController
