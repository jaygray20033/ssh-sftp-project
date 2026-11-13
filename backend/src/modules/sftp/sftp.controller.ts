import { Request, Response, NextFunction } from 'express'

import { BadRequestError } from '@common/errors'

import HostService from '@modules/hosts/host.service'

import { RenameSftpBodySchema, MkdirSftpBodySchema, SftpPathQuerySchema, DeleteSftpQuerySchema } from './dto'
import SftpService from './sftp.service'

// SFTP paths are relative to the SSH user's home; "." means home.
const home = (path: string) => (path === '.' ? '' : path)

class SftpController {
  /** Ownership like B03 + the host key must be trusted before any SFTP call. */
  private static async getTrustedHost(id: string, userId: string) {
    const host = await HostService.getOwnedHost(id, userId)
    if (!host.hostKeyFingerprint) {
      // Client checks this code and tells the user to run a connection test first.
      throw new BadRequestError(
        'HOST_KEY_UNVERIFIED: run a connection test or terminal session first and trust the host key'
      )
    }
    return host
  }

  static async list(req: Request, res: Response) {
    const { path } = SftpPathQuerySchema.parse(req.query)
    const host = await SftpController.getTrustedHost(req.params.id as string, req.user!.id)
    const result = await SftpService.list(host, path)
    return res.ok({ ...result, path: home(result.path) }, { message: 'Directory listing retrieved' })
  }

  static async download(req: Request, res: Response, next: NextFunction) {
    const { path } = SftpPathQuerySchema.parse(req.query)
    const host = await SftpController.getTrustedHost(req.params.id as string, req.user!.id)
    const { stream, size, fileName } = await SftpService.openReadStream(host, path)

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', String(size))
    res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/["\\]/g, '_')}"`)
    stream.pipe(res)
    stream.on('error', (err) => {
      if (res.headersSent) res.destroy()
      else next(err)
    })
  }

  static async upload(req: Request, res: Response) {
    const { path } = SftpPathQuerySchema.parse(req.query)
    const host = await SftpController.getTrustedHost(req.params.id as string, req.user!.id)
    const file = req.file!

    // Path is a directory: the file keeps its own name inside it.
    const target = path === '.' ? file.originalname : `${path}/${file.originalname}`
    await SftpService.upload(host, file.path, target)
    return res.ok({ path: target }, { message: 'File uploaded successfully' })
  }

  static async rename(req: Request, res: Response) {
    const { from, to } = RenameSftpBodySchema.parse(req.body)
    const host = await SftpController.getTrustedHost(req.params.id as string, req.user!.id)
    await SftpService.rename(host, home(from), home(to))
    return res.ok(null, { message: 'Renamed successfully' })
  }

  static async mkdir(req: Request, res: Response) {
    const { path } = MkdirSftpBodySchema.parse(req.body)
    const host = await SftpController.getTrustedHost(req.params.id as string, req.user!.id)
    await SftpService.mkdir(host, home(path))
    return res.ok({ path }, { message: 'Directory created' })
  }

  static async remove(req: Request, res: Response) {
    const { path, recursive } = DeleteSftpQuerySchema.parse(req.query)
    const host = await SftpController.getTrustedHost(req.params.id as string, req.user!.id)
    await SftpService.remove(host, home(path), recursive)
    return res.ok(null, { message: 'Deleted successfully' })
  }
}

export default SftpController
