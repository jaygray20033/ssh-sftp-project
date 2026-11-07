import { z } from 'zod/v4'

import { passwordSchema } from '@common/validators'

const RegisterBodyBaseSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.email(),
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(1).max(255)
})

export const RegisterBodyExample = {
  username: 'kimnguen79',
  email: 'kimnguen79lc@gmail.com',
  password: 'Abc123!@#',
  confirmPassword: 'Abc123!@#',
  fullName: 'Kim Nguyen'
} satisfies z.input<typeof RegisterBodyBaseSchema>

export const RegisterBodySchema = RegisterBodyBaseSchema.refine((data) => data.confirmPassword === data.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).meta({
  example: RegisterBodyExample
})

export type RegisterBody = z.infer<typeof RegisterBodySchema>
