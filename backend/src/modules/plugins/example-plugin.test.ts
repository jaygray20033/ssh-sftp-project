import http from 'node:http'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import PluginService from './plugin.service'

/** Loads the sample plugin shipped in the repository and checks the webhook payloads it sends. */
describe('plugins/example-webhook', () => {
  it('POSTs session start and session end events', async () => {
    const received: Record<string, string>[] = []
    const sink = http.createServer((req, res) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        received.push(JSON.parse(body) as Record<string, string>)
        res.writeHead(200)
        res.end('ok')
      })
    })
    await new Promise<void>((resolve) => sink.listen(0, '127.0.0.1', resolve))
    const { port } = sink.address() as { port: number }
    process.env.EXAMPLE_WEBHOOK_URL = `http://127.0.0.1:${port}`

    const pluginsDir = path.resolve(__dirname, '../../../../plugins')
    expect(PluginService.load(pluginsDir).map((plugin) => plugin.name)).toContain('example-webhook')

    const ctx = { userId: 'user-1', sessionId: 'log-1', hostLabel: 'vps-com' }
    await PluginService.emitSessionStart({ ...ctx, startedAt: '2026-01-01T10:00:00.000Z' })
    await PluginService.emitSessionEnd({ ...ctx, endedAt: '2026-01-01T10:05:00.000Z', reason: 'Idle timeout' })

    sink.close()
    delete process.env.EXAMPLE_WEBHOOK_URL

    expect(received.map((event) => event.event)).toEqual(['session:start', 'session:end'])
    expect(received[0]).toMatchObject({ event: 'session:start', userId: 'user-1', hostLabel: 'vps-com' })
    expect(received[1]).toMatchObject({ event: 'session:end', sessionId: 'log-1', reason: 'Idle timeout' })
  })
})
