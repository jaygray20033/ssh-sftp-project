import { z } from 'zod/v4'

export const CreateTicketBodySchema = z
  .object({
    hostId: z.uuid()
  })
  .meta({ example: { hostId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } })

export type CreateTicketBody = z.infer<typeof CreateTicketBodySchema>
