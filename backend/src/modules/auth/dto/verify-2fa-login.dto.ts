import { z } from 'zod/v4'

export const TwoFactorLoginBodySchema = z.object({
  pendingToken: z.string().min(1),
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/)
})

export type TwoFactorLoginBody = z.infer<typeof TwoFactorLoginBodySchema>
