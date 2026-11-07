import { Router } from 'express'

import AuthenticateMiddleware from '@common/middlewares/auth.middleware'

import AuthRoute from '@modules/auth/auth.route'
import HealthRoute from '@modules/health/health.route'
import HostRoute from '@modules/hosts/host.route'
import UserRoute from '@modules/user/user.route'

const router = Router()

router.use('/auth', AuthRoute)
router.use('/health', HealthRoute)
router.use('/users', AuthenticateMiddleware.authenticate, UserRoute)
router.use('/hosts', AuthenticateMiddleware.authenticate, HostRoute)

export default router
