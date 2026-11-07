import { z } from 'zod/v4'

import { passwordSchema } from '@common/validators'

const UpdateUserPasswordBodyBaseSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: z.string()
})

export const UpdateUserPasswordBodyExample = {
  currentPassword: 'OldPassword@123',
  newPassword: 'NewPassword@123',
  confirmPassword: 'NewPassword@123'
} satisfies z.input<typeof UpdateUserPasswordBodyBaseSchema>

export const UpdateUserPasswordBodySchema = UpdateUserPasswordBodyBaseSchema.refine(
  (data) => data.confirmPassword === data.newPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
).meta({
  example: UpdateUserPasswordBodyExample
})

export type UpdateUserPasswordBody = Omit<z.infer<typeof UpdateUserPasswordBodySchema>, 'confirmPassword'>
