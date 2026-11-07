import { Router } from 'express'

import { validateBody } from '@common/middlewares'

import { UpdateUserBodySchema, UpdateUserPasswordBodySchema } from './dto'
import UserController from './user.controller'

const router = Router()

router.get('/me', UserController.getUserInfo)
router.patch('/me', validateBody(UpdateUserBodySchema), UserController.updateUserInfo)
router.patch('/me/password', validateBody(UpdateUserPasswordBodySchema), UserController.updateUserPassword)
router.delete('/me', UserController.deleteUser)

export default router
