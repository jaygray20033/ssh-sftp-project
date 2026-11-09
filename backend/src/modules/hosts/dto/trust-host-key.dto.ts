import { z } from 'zod/v4'

export const TrustHostKeyBodySchema = z
  .object({
    fingerprint: z.string().regex(/^SHA256:[A-Za-z0-9+/]{43}$/, 'Invalid fingerprint')
  })
  .meta({ example: { fingerprint: 'SHA256:uNiVztksCsDhcc0u9e8BujQXVUpKZIDTMczCvj3tD2s' } })

export type TrustHostKeyBody = z.infer<typeof TrustHostKeyBodySchema>
