import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import express, { Router } from 'express'
import { afterAll, describe, expect, it } from 'vitest'

import PluginService from './plugin.service'

import type { LoadedPlugin, SessionStartContext } from './plugin.types'

interface RecordedEvent {
  hook: string
  ctx: Record<string, unknown>
  frozen: boolean
}

const tempRoots: string[] = []

const newRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'shelldeck-plugins-'))
  tempRoots.push(root)
  return root
}

/** Writes one plugin folder: manifest plus the entry file body. */
const writePlugin = (root: string, folder: string, hooks: string[], code: string): string => {
  const dir = path.join(root, folder)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    path.join(dir, 'shelldeck-plugin.json'),
    JSON.stringify({ name: folder, version: '1.0.0', main: 'index.js', hooks })
  )
  writeFileSync(path.join(dir, 'index.js'), code)
  return dir
}

/** A plugin that records every hook call in a file, so the test can read what the plugin saw. */
const recordingPlugin = (root: string, folder: string, outFile: string): string =>
  writePlugin(
    root,
    folder,
    ['onSessionStart', 'onSessionEnd'],
    `'use strict'
const fs = require('node:fs')
const record = (hook, ctx) =>
  fs.appendFileSync(${JSON.stringify(outFile)}, JSON.stringify({ hook, ctx, frozen: Object.isFrozen(ctx) }) + '\\n')
module.exports = { onSessionStart: (ctx) => record('start', ctx), onSessionEnd: (ctx) => record('end', ctx) }`
  )

const readEvents = (outFile: string): RecordedEvent[] =>
  existsSync(outFile)
    ? readFileSync(outFile, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as RecordedEvent)
    : []

const startContext = {
  userId: 'user-1',
  sessionId: 'log-1',
  hostLabel: 'vps-com',
  startedAt: '2026-01-01T10:00:00.000Z'
}

const names = (plugins: LoadedPlugin[]): string[] => plugins.map((plugin) => plugin.name)

afterAll(() => {
  for (const root of tempRoots) rmSync(root, { recursive: true, force: true })
})

describe('PluginService.load', () => {
  it('loads nothing when the plugin directory does not exist', () => {
    expect(names(PluginService.load(path.join(newRoot(), 'abs')))).toEqual([])
  })

  it('ignores folders without a manifest', () => {
    const root = newRoot()
    mkdirSync(path.join(root, 'random-folder'), { recursive: true })

    expect(names(PluginService.load(root))).toEqual([])
  })

  it('skips a plugin whose manifest is invalid', () => {
    const root = newRoot()
    const dir = writePlugin(root, 'bad-manifest', ['nope'], 'module.exports = {}')
    writeFileSync(
      path.join(dir, 'shelldeck-plugin.json'),
      JSON.stringify({ name: 'Bad Name', version: '1.0.0', main: 'index.js' })
    )

    expect(names(PluginService.load(root))).toEqual([])
  })

  it('skips a plugin whose entry file throws while loading', () => {
    const root = newRoot()
    writePlugin(root, 'crashing', ['onSessionStart'], 'throw new Error("cannot load")')

    expect(names(PluginService.load(root))).toEqual([])
  })

  it('skips a plugin whose main points outside its own folder', () => {
    const root = newRoot()
    recordingPlugin(root, 'victim', path.join(root, 'victim.log'))
    const dir = writePlugin(root, 'escaping', ['onSessionStart'], 'module.exports = { onSessionStart: () => {} }')
    writeFileSync(
      path.join(dir, 'shelldeck-plugin.json'),
      JSON.stringify({ name: 'escaping', version: '1.0.0', main: '../victim/index.js', hooks: ['onSessionStart'] })
    )

    expect(names(PluginService.load(root))).toEqual(['victim'])
  })

  it('keeps only the hooks declared in the manifest and exported by the file', () => {
    const root = newRoot()
    const outFile = path.join(root, 'half.log')
    writePlugin(
      root,
      'half-done',
      ['onSessionStart', 'registerRoutes'],
      `'use strict'
const fs = require('node:fs')
module.exports = { onSessionStart: (ctx) => fs.appendFileSync(${JSON.stringify(outFile)}, 'start\\n') }`
    )

    const [plugin] = PluginService.load(root)
    expect(Object.keys(plugin.hooks)).toEqual(['onSessionStart'])

    PluginService.registerRoutes(Router())
    expect(names(PluginService.load(root))).toEqual(['half-done'])
  })
})

describe('PluginService session hooks', () => {
  it('passes only userId, sessionId, hostLabel and the time to the plugin', async () => {
    const root = newRoot()
    const outFile = path.join(root, 'events.log')
    recordingPlugin(root, 'recorder', outFile)

    PluginService.load(root)
    await PluginService.emitSessionStart(startContext)
    await PluginService.emitSessionEnd({
      userId: 'user-1',
      sessionId: 'log-1',
      hostLabel: 'vps-com',
      endedAt: '2026-01-01T10:05:00.000Z',
      reason: 'Idle timeout'
    })

    const events = readEvents(outFile)
    expect(events.map((event) => event.hook)).toEqual(['start', 'end'])
    expect(events[0].ctx).toEqual(startContext)
    expect(events[0].frozen).toBe(true)
    expect(Object.keys(events[1].ctx).sort()).toEqual(['endedAt', 'hostLabel', 'reason', 'sessionId', 'userId'])
  })

  it('strips anything the hook contract does not document, such as a password', async () => {
    const root = newRoot()
    const outFile = path.join(root, 'events.log')
    recordingPlugin(root, 'recorder', outFile)
    PluginService.load(root)

    const leaky = { ...startContext, password: 'hunter2', privateKey: 'ssh-rsa ...' }
    await PluginService.emitSessionStart(leaky as SessionStartContext)

    expect(readEvents(outFile)[0].ctx).toEqual(startContext)
  })

  it('finishes and lets the other plugins run when one hook throws', async () => {
    const root = newRoot()
    const outFile = path.join(root, 'events.log')
    writePlugin(
      root,
      'a-broken',
      ['onSessionStart'],
      'module.exports = { onSessionStart: () => { throw new Error("boom") } }'
    )
    recordingPlugin(root, 'b-working', outFile)

    expect(names(PluginService.load(root))).toEqual(['a-broken', 'b-working'])

    await expect(PluginService.emitSessionStart(startContext)).resolves.toBeUndefined()
    expect(readEvents(outFile).map((event) => event.hook)).toEqual(['start'])
  })
})

describe('PluginService.registerRoutes', () => {
  it('serves plugin routes under the plugin name and ignores a failing plugin', async () => {
    const root = newRoot()
    writePlugin(
      root,
      'router-ok',
      ['registerRoutes'],
      'module.exports = { registerRoutes: (router) => router.get("/ping", (_req, res) => res.json({ pong: true })) }'
    )
    writePlugin(
      root,
      'router-bad',
      ['registerRoutes'],
      'module.exports = { registerRoutes: () => { throw new Error("bad") } }'
    )

    PluginService.load(root)

    const pluginsRouter = Router()
    PluginService.registerRoutes(pluginsRouter)

    const app = express()
    app.use('/api/v1/plugins', pluginsRouter)
    const server = app.listen(0)
    const { port } = server.address() as { port: number }

    try {
      const ok = await fetch(`http://127.0.0.1:${port}/api/v1/plugins/router-ok/ping`)
      expect(ok.status).toBe(200)
      await expect(ok.json()).resolves.toEqual({ pong: true })

      const bad = await fetch(`http://127.0.0.1:${port}/api/v1/plugins/router-bad/ping`)
      expect(bad.status).toBe(404)
    } finally {
      server.close()
    }
  })
})
