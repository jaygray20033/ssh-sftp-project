import { z } from 'zod/v4'

export const ListHostsQueryBaseSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  search: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(30).optional()
})

export const ListHostsQueryExample = {
  limit: 20,
  offset: 0
} satisfies z.input<typeof ListHostsQueryBaseSchema>

export const ListHostsQuerySchema = ListHostsQueryBaseSchema.meta({ example: ListHostsQueryExample })

export type ListHostsQuery = z.infer<typeof ListHostsQuerySchema>
