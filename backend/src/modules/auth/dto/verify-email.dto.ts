import { z } from 'zod/v4'

import { TOKEN_LENGTH } from '@common/constants/auth.constant'

const VerifyEmailBodyBaseSchema = z.object({
  token: z.string().min(TOKEN_LENGTH)
})

export const VerifyEmailBodyExample = {
  token: 'a3f9c2d1e8b74056af12cd93e6b5a201'
} satisfies z.input<typeof VerifyEmailBodyBaseSchema>

export const VerifyEmailBodySchema = VerifyEmailBodyBaseSchema.meta({
  example: VerifyEmailBodyExample
})

export type VerifyEmailBody = z.infer<typeof VerifyEmailBodySchema>
