import { z } from 'zod/v4'

import type { Router } from 'express'

export const PLUGIN_HOOKS = ['onSessionStart', 'onSessionEnd', 'registerRoutes'] as const

export type PluginHook = (typeof PLUGIN_HOOKS)[number]

export const PluginManifestSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9][a-z0-9._-]{0,63}$/, 'Plugin name must be lower-case and start with a letter or digit'),
  version: z.string().min(1),
  main: z
    .string()
    .min(1)
    .regex(/^[^/\\].*\.js$/, 'Plugin main must be a relative path to a .js file'),
  hooks: z.array(z.enum(PLUGIN_HOOKS)).default([])
})

export type PluginManifest = z.infer<typeof PluginManifestSchema>

/**
 * What a plugin may see about a session. Add only non-sensitive fields here:
 * credentials, keys, tokens, IP addresses and terminal content must never be exposed.
 */
export interface SessionStartContext {
  readonly userId: string
  readonly sessionId: string
  readonly hostLabel: string
  readonly startedAt: string
}

export interface SessionEndContext {
  readonly userId: string
  readonly sessionId: string
  readonly hostLabel: string
  readonly endedAt: string
  /** Why the session ended, e.g. "Client disconnected". */
  readonly reason: string
}

export type PluginContext = SessionStartContext | SessionEndContext

export type SessionHook = (ctx: PluginContext) => void | Promise<void>
export type RegisterRoutesHook = (router: Router) => void

export interface LoadedPlugin {
  readonly name: string
  readonly version: string
  readonly dir: string
  readonly hooks: Partial<Record<PluginHook, SessionHook | RegisterRoutesHook>>
}
