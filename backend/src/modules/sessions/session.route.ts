import { Router } from 'express'

import { validateParam } from '@common/middlewares'

import { SessionIdParamSchema } from './dto'
import SessionController from './session.controller'

const router = Router()

router.get('/', SessionController.getSessions)
// Recording download (B11).
router.get('/:id/recording', validateParam(SessionIdParamSchema), SessionController.getRecording)

export default router
