import { z } from 'zod/v4'

const UpdateUserBodyBaseSchema = z
  .object({
    username: z.string().min(3).max(30),
    fullName: z.string().min(1).max(255),
    avatarUrl: z.url().nullable().optional()
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required'
  })

export const UpdateUserBodyExample = {
  username: 'kimnguen79',
  fullName: 'Kim Nguyen',
  avatarUrl: 'https://example.com/avatar.png'
} satisfies z.input<typeof UpdateUserBodyBaseSchema>

export const UpdateUserBodySchema = UpdateUserBodyBaseSchema.meta({
  example: UpdateUserBodyExample
})

export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>
