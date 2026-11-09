import { Router } from 'express'

import { sshTestRateLimiterMiddleware, validateBody, validateQuery } from '@common/middlewares'

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

// TODO(B06): terminal tickets + WebSocket gateway
// TODO(B08): /:id/sftp/*

export default router
