import { z } from 'zod/v4'

export const ListSessionsQueryBaseSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0)
})

export const ListSessionsQueryExample = {
  limit: 20,
  offset: 0
} satisfies z.input<typeof ListSessionsQueryBaseSchema>

export const ListSessionsQuerySchema = ListSessionsQueryBaseSchema.meta({ example: ListSessionsQueryExample })

// GET /sessions/:id/recording
export const SessionIdParamBaseSchema = z.object({
  id: z.uuid()
})

export const SessionIdParamSchema = SessionIdParamBaseSchema.meta({
  example: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }
})

export type ListSessionsQuery = z.infer<typeof ListSessionsQuerySchema>
