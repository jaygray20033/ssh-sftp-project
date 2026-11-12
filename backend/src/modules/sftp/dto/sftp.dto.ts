import { z } from 'zod/v4'

import { normalizeSftpPath } from '../sftp-path'

// Shared query: every SFTP endpoint takes the remote path this way.
export const SftpPathQueryBaseSchema = z.object({
  path: z
    .string()
    .optional()
    .transform((val) => normalizeSftpPath(val))
})

export const SftpPathQueryExample = { path: 'docs' } satisfies z.input<typeof SftpPathQueryBaseSchema>

export const SftpPathQuerySchema = SftpPathQueryBaseSchema.meta({ example: SftpPathQueryExample })

// DELETE query: directory removal can be recursive.
export const DeleteSftpQueryBaseSchema = z.object({
  path: z
    .string()
    .optional()
    .transform((val) => normalizeSftpPath(val)),
  recursive: z.stringbool().default(false)
})

export const DeleteSftpQueryExample = { path: 'docs/old.txt', recursive: 'false' } satisfies z.input<
  typeof DeleteSftpQueryBaseSchema
>

export const DeleteSftpQuerySchema = DeleteSftpQueryBaseSchema.meta({ example: DeleteSftpQueryExample })

// PATCH /rename body: `from` and `to` are both relative to the home directory.
const renamePath = z.string().transform((val) => normalizeSftpPath(val))

export const RenameSftpBodyBaseSchema = z.object({
  from: renamePath,
  to: renamePath
})

export const RenameSftpBodyExample = { from: 'old.txt', to: 'docs/new.txt' } satisfies z.input<
  typeof RenameSftpBodyBaseSchema
>

export const RenameSftpBodySchema = RenameSftpBodyBaseSchema.meta({ example: RenameSftpBodyExample })

// POST /mkdir body.
export const MkdirSftpBodyBaseSchema = z.object({
  path: renamePath
})

export const MkdirSftpBodyExample = { path: 'docs/archive' } satisfies z.input<typeof MkdirSftpBodyBaseSchema>

export const MkdirSftpBodySchema = MkdirSftpBodyBaseSchema.meta({ example: MkdirSftpBodyExample })

export type SftpPathQuery = z.infer<typeof SftpPathQuerySchema>
export type DeleteSftpQuery = z.infer<typeof DeleteSftpQuerySchema>
export type RenameSftpBody = z.infer<typeof RenameSftpBodySchema>
export type MkdirSftpBody = z.infer<typeof MkdirSftpBodySchema>
