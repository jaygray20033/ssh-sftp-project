import { Request, Response } from 'express'

import { CreateHostBody, ListHostsQuerySchema, TrustHostKeyBody, UpdateHostBody } from './dto'
import HostService from './host.service'

class HostController {
  static async getHosts(req: Request, res: Response) {
    const query = ListHostsQuerySchema.parse(req.query)
    const hosts = await HostService.getHosts(req.user!.id, query)
    return res.ok({ hosts }, { message: 'Hosts retrieved successfully' })
  }

  static async getHostById(req: Request, res: Response) {
    const host = await HostService.getHostById(req.params.id as string, req.user!.id)
    return res.ok({ host }, { message: 'Host retrieved successfully' })
  }

  static async createHost(req: Request, res: Response) {
    const host = await HostService.createHost(req.body as CreateHostBody, req.user!.id)
    return res.created({ host }, { message: 'Host created successfully' })
  }

  static async updateHost(req: Request, res: Response) {
    const host = await HostService.updateHost(req.params.id as string, req.user!.id, req.body as UpdateHostBody)
    return res.ok({ host }, { message: 'Host updated successfully' })
  }

  static async testHost(req: Request, res: Response) {
    const result = await HostService.testHost(req.params.id as string, req.user!.id)
    return res.ok(result, { message: result.ok ? 'Connection successful' : 'Connection failed' })
  }

  static async trustHostKey(req: Request, res: Response) {
    const { fingerprint } = req.body as TrustHostKeyBody
    const host = await HostService.trustHostKey(req.params.id as string, req.user!.id, fingerprint)
    return res.ok({ host }, { message: 'Host key trusted' })
  }

  static async deleteHost(req: Request, res: Response) {
    await HostService.deleteHost(req.params.id as string, req.user!.id)
    return res.ok(null, { message: 'Host deleted successfully' })
  }
}

export default HostController
