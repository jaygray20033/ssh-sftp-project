import { z } from 'zod/v4'

const GoogleCallbackBodyBaseSchema = z.object({
  code: z.string().min(10).max(512),
  state: z.string().min(1)
})

export const GoogleCallbackBodyExample = {
  code: '4/0AfJohXn...',
  state: 'random-csrf-token'
} satisfies z.input<typeof GoogleCallbackBodyBaseSchema>

export const GoogleCallbackBodySchema = GoogleCallbackBodyBaseSchema.meta({
  example: GoogleCallbackBodyExample
})

export type GoogleCallbackBody = z.infer<typeof GoogleCallbackBodySchema>
