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

export type ListSessionsQuery = z.infer<typeof ListSessionsQuerySchema>
