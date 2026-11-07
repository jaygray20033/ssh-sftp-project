import { Router } from 'express'

import { validateBody, validateQuery } from '@common/middlewares'

import { CreateHostBodySchema, ListHostsQuerySchema, UpdateHostBodySchema } from './dto'
import HostController from './host.controller'

const router = Router()

router.get('/', validateQuery(ListHostsQuerySchema), HostController.getHosts)
router.get('/:id', HostController.getHostById)
router.post('/', validateBody(CreateHostBodySchema), HostController.createHost)
router.patch('/:id', validateBody(UpdateHostBodySchema), HostController.updateHost)
router.delete('/:id', HostController.deleteHost)

// TODO(B05): POST /:id/test, POST /:id/trust-host-key  (SSH service)
// TODO(B06): terminal tickets + WebSocket gateway
// TODO(B08): /:id/sftp/*

export default router
