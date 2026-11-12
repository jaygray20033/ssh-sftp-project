import { Router } from 'express'

import { sshTestRateLimiterMiddleware, validateBody, validateQuery } from '@common/middlewares'

import SftpRoute from '@modules/sftp/sftp.route'

import { CreateHostBodySchema, ListHostsQuerySchema, TrustHostKeyBodySchema, UpdateHostBodySchema } from './dto'
import HostController from './host.controller'

const router = Router()

router.get('/', validateQuery(ListHostsQuerySchema), HostController.getHosts)
router.get('/:id', HostController.getHostById)
router.post('/', validateBody(CreateHostBodySchema), HostController.createHost)
router.patch('/:id', validateBody(UpdateHostBodySchema), HostController.updateHost)
router.delete('/:id', HostController.deleteHost)
router.post('/:id/test', sshTestRateLimiterMiddleware, HostController.testHost)
router.post('/:id/trust-host-key', validateBody(TrustHostKeyBodySchema), HostController.trustHostKey)

// B08: SFTP endpoints live under /hosts/:id/sftp/*.
router.use(SftpRoute)

export default router
