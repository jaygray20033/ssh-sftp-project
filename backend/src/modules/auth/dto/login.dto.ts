import { z } from 'zod/v4'

const LoginBodyBaseSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
    pendingToken: z.string().min(1).optional(),
    code: z
      .string()
      .length(6)
      .regex(/^\d{6}$/)
      .optional()
  })
  .refine((data) => (data.pendingToken == null) === (data.code == null), {
    message: 'pendingToken and code must both be provided together'
  })

export const LoginBodyExample = {
  email: 'kimnguen79lc@gmail.com',
  password: 'Abc123!@#'
} satisfies z.input<typeof LoginBodyBaseSchema>

export const LoginBodyTwoFactorExample = {
  email: 'kimnguen79lc@gmail.com',
  password: 'Abc123!@#',
  pendingToken: 'a3f8d2c1e4b57f9a...',
  code: '123456'
} satisfies z.input<typeof LoginBodyBaseSchema>

export const LoginBodySchema = LoginBodyBaseSchema.meta({ example: LoginBodyExample })

export type LoginBody = z.infer<typeof LoginBodySchema>
