import { z } from 'zod/v4'

import { TOKEN_LENGTH } from '@common/constants'
import { passwordSchema } from '@common/validators'

const ResetPasswordBodyBaseSchema = z.object({
  token: z.string().length(TOKEN_LENGTH),
  password: passwordSchema,
  confirmPassword: z.string()
})

export const ResetPasswordBodyExample = {
  token: '123456',
  password: 'Abc123!@#',
  confirmPassword: 'Abc123!@#'
} satisfies z.input<typeof ResetPasswordBodyBaseSchema>

export const ResetPasswordBodySchema = ResetPasswordBodyBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
).meta({
  example: ResetPasswordBodyExample
})

export type ResetPasswordBody = z.infer<typeof ResetPasswordBodySchema>
