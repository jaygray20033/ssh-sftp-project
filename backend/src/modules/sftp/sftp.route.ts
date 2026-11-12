import { Router } from 'express'

import { validateBody, validateQuery } from '@common/middlewares'

import { MkdirSftpBodySchema, RenameSftpBodySchema, SftpPathQuerySchema, DeleteSftpQuerySchema } from './dto'
import { sftpUploadMiddleware } from './sftp-upload.middleware'
import SftpController from './sftp.controller'

// Mounted at /hosts/:id/sftp (see host.route.ts).
const router = Router()

router.get('/:id/sftp/list', validateQuery(SftpPathQuerySchema), SftpController.list)
router.get('/:id/sftp/download', validateQuery(SftpPathQuerySchema), SftpController.download)
router.post('/:id/sftp/upload', sftpUploadMiddleware, validateQuery(SftpPathQuerySchema), SftpController.upload)
router.patch('/:id/sftp/rename', validateBody(RenameSftpBodySchema), SftpController.rename)
router.delete('/:id/sftp', validateQuery(DeleteSftpQuerySchema), SftpController.remove)
router.post('/:id/sftp/mkdir', validateBody(MkdirSftpBodySchema), SftpController.mkdir)

export default router
