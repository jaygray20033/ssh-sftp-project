import net from 'node:net'

import { z } from 'zod/v4'

import { AuthType, HOST_MAX_TAGS, HOST_SECRET_MAX_LENGTH } from '@common/constants/host.constant'

const HOSTNAME_REGEX = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i

export const hostnameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((v) => net.isIP(v) !== 0 || HOSTNAME_REGEX.test(v), 'Invalid hostname or IP address')

export const tagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(30)
      .regex(/^[^,]+$/, 'Tags cannot contain commas')
  )
  .max(HOST_MAX_TAGS)

const authTypeSchema = z.enum(Object.values(AuthType) as [AuthType, ...AuthType[]])

const CreateHostBodyBaseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  hostname: hostnameSchema,
  port: z.int().min(1).max(65535).default(22),
  username: z.string().trim().min(1).max(100),
  authType: authTypeSchema,
  // Password or PEM private key. Stored encrypted, never returned.
  secret: z.string().min(1).max(HOST_SECRET_MAX_LENGTH),
  passphrase: z.string().max(1024).optional(),
  tags: tagsSchema.default([])
})

export const CreateHostBodyExample = {
  name: 'Dev server',
  hostname: '192.168.1.10',
  port: 22,
  username: 'dev',
  authType: AuthType.PASSWORD,
  secret: 'dev',
  tags: ['dev']
} satisfies z.input<typeof CreateHostBodyBaseSchema>

export const CreateHostBodySchema = CreateHostBodyBaseSchema.meta({ example: CreateHostBodyExample })

export type CreateHostBody = z.infer<typeof CreateHostBodySchema>
