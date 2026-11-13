// E2E acceptance for B09 (host health), B10 (snippets), B11 (session recording).
// Temp deps: postgres on 5433, sshd container (user dev / dev) on 2222, API on 8090.
// Run: node b0911-check.mjs  (E2E_TOKEN set). NOT part of the test suite.
import { execSync } from 'node:child_process'

import { WebSocket } from 'ws'

const BASE = 'http://localhost:8090/api/v1'
const log = (...args) => console.log('[e2e]', ...args)
const fail = (msg) => {
  console.error('[e2e][FAIL]', msg)
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const token = process.env.E2E_TOKEN ?? ''
if (!token) fail('Set E2E_TOKEN (access token) first')

const api = async (path, init = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

// ---------- Phase 1: snippets (B10) ----------
log('== B10: snippets CRUD ==')
let r = await api('/snippets', {
  method: 'POST',
  body: JSON.stringify({ name: 'e2e-disk', command: 'df -h', description: 'disk usage' })
})
if (r.status !== 201) fail(`create snippet -> ${r.status} ${JSON.stringify(r.body)}`)
const snippetId = r.body.data.snippet.id
log('created snippet', snippetId)

r = await api('/snippets')
if (r.status !== 200) fail(`list snippets -> ${r.status}`)
log('list snippets ok, total =', r.body.data.snippets.total_count)

r = await api(`/snippets/${snippetId}`, { method: 'PATCH', body: JSON.stringify({ command: 'df -h /' }) })
if (r.status !== 200) fail(`update snippet -> ${r.status}`)
r = await api(`/snippets/${snippetId}`, { method: 'DELETE' })
if (r.status !== 200) fail(`delete snippet -> ${r.status}`)
log('snippet CRUD ok')

// ---------- Phase 2: host + health (B09) ----------
log('== B09/B11: host ==')
r = await api('/hosts', {
  method: 'POST',
  body: JSON.stringify({
    name: 'e2e-sshd',
    hostname: '127.0.0.1',
    port: 2222,
    username: 'dev',
    authType: 'password',
    secret: 'dev',
    recordSessions: true
  })
})
if (r.status !== 201) fail(`create host -> ${r.status} ${JSON.stringify(r.body)}`)
const hostId = r.body.data.host.id
log('created host', hostId)

// Wait for the health job to mark it up (first cycle 5s after boot, interval 2s).
let up = false
for (let i = 0; i < 15; i++) {
  await sleep(1000)
  r = await api('/hosts')
  const host = r.body.data.hosts.entries.find((h) => h.id === hostId)
  if (host.status === 'up') {
    up = true
    log('host status up, lastCheckedAt =', host.lastCheckedAt)
    break
  }
  log('waiting, status =', host.status)
}
if (!up) fail('host never became up')

// SSH test endpoint to get the fingerprint.
r = await api(`/hosts/${hostId}/test`, { method: 'POST' })
const test = r.body.data
if (r.status !== 200 || !test.ok) fail(`test host -> ${r.status} ${JSON.stringify(r.body)}`)
log('ssh test ok, fingerprint =', test.fingerprint)

r = await api(`/hosts/${hostId}/trust-host-key`, {
  method: 'POST',
  body: JSON.stringify({ fingerprint: test.fingerprint })
})
if (r.status !== 200) fail(`trust key -> ${r.status} ${JSON.stringify(r.body)}`)
log('host key trusted')

// ---------- Phase 3: terminal + recording (B11) ----------
log('== B11: terminal session + recording ==')
r = await api('/terminal/tickets', { method: 'POST', body: JSON.stringify({ hostId }) })
if (r.status !== 201) fail(`ticket -> ${r.status} ${JSON.stringify(r.body)}`)
const ticket = r.body.data.ticket
log('ticket ok')

const ws = new WebSocket(`ws://localhost:8090/api/v1/terminal/ws?ticket=${ticket}`, { origin: 'http://localhost:3000' })
let sawOutput = false
let sawReady = false
ws.on('message', (raw) => {
  const msg = JSON.parse(String(raw))
  if (msg.type === 'ready') {
    sawReady = true
    ws.send(JSON.stringify({ type: 'input', data: 'echo hi-from-record\r' }))
  }
  if (msg.type === 'data' && msg.data.includes('hi-from-record')) sawOutput = true
  if (msg.type === 'hostkey') fail(`unexpected hostkey prompt ${msg.fingerprint}`)
  if (msg.type === 'error') fail(`ws error ${msg.code} ${msg.message}`)
})
await new Promise((resolve, reject) => {
  ws.on('open', resolve)
  ws.on('error', reject)
  setTimeout(() => reject(new Error('ws open timeout')), 10000)
})
for (let i = 0; i < 20 && !(sawReady && sawOutput); i++) await sleep(500)
if (!sawReady) fail('terminal never became ready')
if (!sawOutput) fail('never saw "hi-from-record" in terminal output')
ws.close()
log('terminal round-trip ok')

await sleep(1500)

r = await api('/sessions?limit=5')
const sessions = r.body.data.sessions.entries
const withRecording = sessions.find((s) => s.hasRecording)
if (!withRecording) fail(`no session with hasRecording; entries=${JSON.stringify(sessions)}`)
log('session', withRecording.id, 'hasRecording = true')

const res = await fetch(`${BASE}/sessions/${withRecording.id}/recording`, {
  headers: { Authorization: `Bearer ${token}` }
})
const cast = await res.text()
if (res.status !== 200) fail(`recording -> ${res.status} ${cast}`)
if (!cast.startsWith('{"version":2')) fail(`not asciicast v2: ${cast.slice(0, 60)}`)
if (!cast.includes('hi-from-record')) fail('recording does not contain the typed output')
log('recording ok: asciicast v2,', cast.split('\n').length - 1, 'lines,', cast.length, 'bytes')

// ---------- Phase 4: B09 down after stopping sshd ----------
log('== B09: sshd stopped -> down within one cycle ==')
execSync('docker stop shelldeck-b0911-sshd', { stdio: 'ignore' })
const deadline = Date.now() + 10000 // interval is 2s, allow generous margin
let down = false
while (Date.now() < deadline) {
  await sleep(1000)
  r = await api('/hosts')
  const host = r.body.data.hosts.entries.find((h) => h.id === hostId)
  if (host?.status === 'down') {
    down = true
    break
  }
}
if (!down) fail('host never became down after sshd stopped')
execSync('docker start shelldeck-b0911-sshd', { stdio: 'ignore' })
log('host down detected within one cycle')

log('ALL E2E CHECKS PASSED')
