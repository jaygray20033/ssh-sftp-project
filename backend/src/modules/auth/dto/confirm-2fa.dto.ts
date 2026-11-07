import { z } from 'zod/v4'

const ConfirmTwoFactorBodyBaseSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  setUpToken: z.string().min(1)
})

export const ConfirmTwoFactorBodyExample = {
  code: '123456',
  setUpToken: 'a3f8d2c1e4b57f9a...'
} satisfies z.input<typeof ConfirmTwoFactorBodyBaseSchema>

export const ConfirmTwoFactorBodySchema = ConfirmTwoFactorBodyBaseSchema.meta({
  example: ConfirmTwoFactorBodyExample
})

export type ConfirmTwoFactorBody = z.infer<typeof ConfirmTwoFactorBodySchema>
