import { Request, Response } from 'express'

import HealthService from './health.service'

class HealthController {
  static async getHealth(_req: Request, res: Response) {
    const data = await HealthService.getHealthStatus()

    if (data.status === 'unhealthy') {
      return res.fail({ message: 'Service unavailable', statusCode: 503 })
    }

    res.ok(data, { message: 'Service is healthy' })
  }
}

export default HealthController
