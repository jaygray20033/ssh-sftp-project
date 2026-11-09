import { Router } from 'express'

import { terminalTicketRateLimiterMiddleware, validateBody } from '@common/middlewares'

import { CreateTicketBodySchema } from './dto'
import TerminalController from './terminal.controller'

const router = Router()

router.post(
  '/tickets',
  terminalTicketRateLimiterMiddleware,
  validateBody(CreateTicketBodySchema),
  TerminalController.createTicket
)

export default router
