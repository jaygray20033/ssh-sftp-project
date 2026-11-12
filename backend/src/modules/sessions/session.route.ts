import { Router } from 'express'

import SessionController from './session.controller'

const router = Router()

router.get('/', SessionController.getSessions)

export default router
