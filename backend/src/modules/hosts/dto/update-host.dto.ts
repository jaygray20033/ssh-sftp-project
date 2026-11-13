import { z } from 'zod/v4'

import { AuthType, HOST_SECRET_MAX_LENGTH } from '@common/constants/host.constant'

import { hostnameSchema, tagsSchema } from './create-host.dto'

const UpdateHostBodyBaseSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    hostname: hostnameSchema,
    port: z.int().min(1).max(65535),
    username: z.string().trim().min(1).max(100),
    authType: z.enum(Object.values(AuthType) as [AuthType, ...AuthType[]]),
    // Omit to keep the stored secret unchanged.
    secret: z.string().min(1).max(HOST_SECRET_MAX_LENGTH),
    // null removes the stored passphrase.
    passphrase: z.string().max(1024).nullable(),
    tags: tagsSchema,
    recordSessions: z.boolean()
  })
  .partial()

export const UpdateHostBodyExample = {
  name: 'Dev server',
  port: 2222
} satisfies z.input<typeof UpdateHostBodyBaseSchema>

export const UpdateHostBodySchema = UpdateHostBodyBaseSchema.meta({ example: UpdateHostBodyExample })

export type UpdateHostBody = z.infer<typeof UpdateHostBodyBaseSchema>
