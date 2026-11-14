import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { Router } from 'express'

import env from '@common/config/env'
import logger from '@common/config/logger'

import {
  LoadedPlugin,
  PluginContext,
  PluginHook,
  PluginManifestSchema,
  RegisterRoutesHook,
  SessionEndContext,
  SessionHook,
  SessionStartContext
} from './plugin.types'

const MANIFEST_FILE = 'shelldeck-plugin.json'

// Only these context fields ever reach a plugin, whatever the caller passes in.
const CONTEXT_FIELDS: Record<'onSessionStart' | 'onSessionEnd', readonly string[]> = {
  onSessionStart: ['userId', 'sessionId', 'hostLabel', 'startedAt'],
  onSessionEnd: ['userId', 'sessionId', 'hostLabel', 'endedAt', 'reason']
}

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err))

/**
 * Loads plain CommonJS plugins from PLUGINS_DIR. Every step is guarded: a plugin with a bad
 * manifest, a missing file or a throwing hook is logged and skipped, never fatal for the server.
 */
class PluginService {
  private static readonly plugins = new Map<string, LoadedPlugin>()

  static load(pluginsDir = env.PLUGINS_DIR): LoadedPlugin[] {
    this.plugins.clear()

    const root = path.resolve(pluginsDir)
    let folders: string[]

    try {
      folders = readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    } catch (err) {
      logger.info({ pluginsDir: root, err: errorMessage(err) }, 'No plugins loaded')
      return []
    }

    for (const folder of folders) {
      try {
        const plugin = this.loadOne(path.join(root, folder))
        if (!plugin) continue

        if (this.plugins.has(plugin.name)) {
          logger.warn({ plugin: plugin.name, dir: plugin.dir }, 'Duplicate plugin name, skipping')
          continue
        }
        this.plugins.set(plugin.name, plugin)
      } catch (err) {
        logger.error({ plugin: folder, dir: path.join(root, folder), err: errorMessage(err) }, 'Plugin failed to load')
      }
    }

    if (this.plugins.size > 0) {
      const loaded = [...this.plugins.values()].map((plugin) => `${plugin.name}@${plugin.version}`)
      logger.info({ plugins: loaded }, 'Plugins loaded')
    }

    return [...this.plugins.values()]
  }

  private static loadOne(dir: string): LoadedPlugin | undefined {
    const manifestPath = path.join(dir, MANIFEST_FILE)
    if (!existsSync(manifestPath)) return undefined

    const manifest = PluginManifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')))

    // A plugin may only require files from its own folder.
    const mainPath = path.resolve(dir, manifest.main)
    if (!mainPath.startsWith(dir + path.sep)) {
      throw new Error(`Plugin main points outside its folder: ${manifest.main}`)
    }

    // The manifest path as require base, so the plugin can also require its own local files.
    const requireFrom = createRequire(pathToFileURL(mainPath).href)
    const exported = requireFrom(mainPath) as Record<string, unknown>

    const hooks: Partial<Record<PluginHook, SessionHook | RegisterRoutesHook>> = {}
    for (const hook of manifest.hooks) {
      const candidate = exported?.[hook]
      if (typeof candidate !== 'function') {
        logger.warn({ plugin: manifest.name, hook }, 'Hook declared in manifest but not exported')
        continue
      }
      hooks[hook] = candidate as SessionHook | RegisterRoutesHook
    }

    return { name: manifest.name, version: manifest.version, dir, hooks }
  }

  /** Session hooks run in the background, so a slow or failing plugin cannot stall a terminal. */
  static emitSessionStart(ctx: SessionStartContext): Promise<void> {
    return this.dispatch('onSessionStart', ctx)
  }

  static emitSessionEnd(ctx: SessionEndContext): Promise<void> {
    return this.dispatch('onSessionEnd', ctx)
  }

  private static dispatch(hook: 'onSessionStart' | 'onSessionEnd', ctx: PluginContext): Promise<void> {
    // Whitelist plus freeze: a plugin sees only what this hook documents, and cannot change it for others.
    const source = ctx as unknown as Record<string, unknown>
    const frozen = Object.freeze(
      Object.fromEntries(CONTEXT_FIELDS[hook].map((field) => [field, source[field]]))
    ) as unknown as PluginContext

    const calls = [...this.plugins.values()].map(async (plugin) => {
      const fn = plugin.hooks[hook] as SessionHook | undefined
      if (!fn) return

      try {
        await fn(frozen)
      } catch (err) {
        logger.warn({ plugin: plugin.name, hook, err: errorMessage(err) }, 'Plugin hook failed')
      }
    })

    return Promise.allSettled(calls).then(() => undefined)
  }

  /** Each plugin gets its own router, mounted under /api/v1/plugins/<name> by the caller. */
  static registerRoutes(router: Router): void {
    for (const plugin of this.plugins.values()) {
      const register = plugin.hooks.registerRoutes as RegisterRoutesHook | undefined
      if (!register) continue

      const subRouter = Router()
      try {
        register(subRouter)
        router.use(`/${plugin.name}`, subRouter)
        logger.info({ plugin: plugin.name }, 'Plugin routes registered')
      } catch (err) {
        logger.error({ plugin: plugin.name, err: errorMessage(err) }, 'Plugin route registration failed')
      }
    }
  }
}

export default PluginService
