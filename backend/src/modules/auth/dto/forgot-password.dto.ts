import { z } from 'zod/v4'

const ForgotPasswordBodyBaseSchema = z.object({
  email: z.email()
})

export const ForgotPasswordBodyExample = {
  email: 'kimnguen79lc@gmail.com'
} satisfies z.input<typeof ForgotPasswordBodyBaseSchema>

export const ForgotPasswordBodySchema = ForgotPasswordBodyBaseSchema.meta({
  example: ForgotPasswordBodyExample
})

export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBodySchema>
