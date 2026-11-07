import { z } from 'zod/v4'

const DisableTwoFactorBodyBaseSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/)
})

export const DisableTwoFactorBodyExample = {
  code: '123456'
} satisfies z.input<typeof DisableTwoFactorBodyBaseSchema>

export const DisableTwoFactorBodySchema = DisableTwoFactorBodyBaseSchema.meta({
  example: DisableTwoFactorBodyExample
})

export type DisableTwoFactorBody = z.infer<typeof DisableTwoFactorBodySchema>
