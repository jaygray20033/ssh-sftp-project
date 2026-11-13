import { z } from 'zod/v4'

import { SNIPPET_COMMAND_MAX_LENGTH, SNIPPET_DESCRIPTION_MAX_LENGTH, SNIPPET_NAME_MAX_LENGTH } from '@common/constants'

const CreateSnippetBodyBaseSchema = z.object({
  name: z.string().trim().min(1).max(SNIPPET_NAME_MAX_LENGTH),
  command: z.string().min(1).max(SNIPPET_COMMAND_MAX_LENGTH),
  description: z.string().trim().max(SNIPPET_DESCRIPTION_MAX_LENGTH).optional()
})

export const CreateSnippetBodyExample = {
  name: 'Disk usage',
  command: 'df -h',
  description: 'Show free disk space'
} satisfies z.input<typeof CreateSnippetBodyBaseSchema>

export const CreateSnippetBodySchema = CreateSnippetBodyBaseSchema.meta({ example: CreateSnippetBodyExample })

const UpdateSnippetBodyBaseSchema = CreateSnippetBodyBaseSchema.partial()

export const UpdateSnippetBodyExample = { name: 'Free space' } satisfies z.input<typeof UpdateSnippetBodyBaseSchema>

export const UpdateSnippetBodySchema = UpdateSnippetBodyBaseSchema.meta({ example: UpdateSnippetBodyExample })

const ListSnippetsQueryBaseSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  search: z.string().trim().max(100).optional()
})

export const ListSnippetsQueryExample = { limit: 20, offset: 0 } satisfies z.input<typeof ListSnippetsQueryBaseSchema>

export const ListSnippetsQuerySchema = ListSnippetsQueryBaseSchema.meta({ example: ListSnippetsQueryExample })

export type CreateSnippetBody = z.infer<typeof CreateSnippetBodySchema>
export type UpdateSnippetBody = z.infer<typeof UpdateSnippetBodySchema>
export type ListSnippetsQuery = z.infer<typeof ListSnippetsQuerySchema>
