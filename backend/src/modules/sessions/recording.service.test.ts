import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import env from '@common/config/env'

import type { Host } from '@entities/host.entity'

import RecordingService from './recording.service'

const makeHost = (): Host =>
  ({
    id: 'host-1',
    userId: 'user-1',
    name: 'srv',
    hostname: 'example.com',
    port: 22,
    username: 'dev',
    authType: 'password',
    encryptedSecret: 'v1:x',
    encryptedPassphrase: null,
    hostKeyFingerprint: null,
    tags: null,
    lastConnectedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    recordSessions: true
  }) as Host

describe('RecordingService (asciicast v2)', () => {
  let dir: string
  const originalDir = env.RECORDINGS_DIR

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelldeck-rec-'))
    env.RECORDINGS_DIR = dir
  })

  afterEach(() => {
    env.RECORDINGS_DIR = originalDir
    fs.rmSync(dir, { recursive: true, force: true })
  })

  const readLines = (sessionLogId: string) =>
    fs
      .readFileSync(path.join(dir, `${sessionLogId}.cast`), 'utf8')
      .trimEnd()
      .split('\n')

  it('writes an asciicast v2 header followed by output events', () => {
    const recorder = RecordingService.start('log-1', makeHost(), 120, 40)!
    RecordingService.appendOutput(recorder, 'hello\r\n')
    RecordingService.appendOutput(recorder, 'world')
    RecordingService.stop(recorder)

    const lines = readLines('log-1')
    const header = JSON.parse(lines[0])
    expect(header).toMatchObject({ version: 2, width: 120, height: 40, env: { TERM: 'xterm-256color' }, title: 'srv' })
    expect(lines).toHaveLength(3)

    const event = JSON.parse(lines[1])
    expect(event[0]).toBeTypeOf('number')
    expect(event[0]).toBeLessThan(1)
    expect(event.slice(1)).toEqual(['o', 'hello\r\n'])
  })

  it('escapes special characters as JSON strings', () => {
    const recorder = RecordingService.start('log-2', makeHost(), 80, 24)!
    RecordingService.appendOutput(recorder, 'quote " backslash \\ \n')
    RecordingService.stop(recorder)
    const event = JSON.parse(readLines('log-2')[1])
    expect(event[2]).toBe('quote " backslash \\ \n')
  })

  it('stops capturing once the size cap is reached', () => {
    env.RECORDING_MAX_SIZE_MB = 1
    try {
      const recorder = RecordingService.start('log-3', makeHost(), 80, 24)!
      // More than 1MB of output: the recorder must cap and stop.
      for (let i = 0; i < 200; i++) {
        RecordingService.appendOutput(recorder, 'x'.repeat(10_000))
        if (recorder.capped) break
      }
      expect(recorder.capped).toBe(true)
      const sizeBefore = fs.statSync(path.join(dir, 'log-3.cast')).size
      RecordingService.appendOutput(recorder, 'dropped after cap')
      expect(fs.statSync(path.join(dir, 'log-3.cast')).size).toBe(sizeBefore)
      RecordingService.stop(recorder)
      expect(recorder.writtenBytes).toBeLessThanOrEqual(1024 * 1024)
    } finally {
      env.RECORDING_MAX_SIZE_MB = 20
    }
  })

  it('reports existence and opens the file for download', async () => {
    const recorder = RecordingService.start('log-4', makeHost(), 80, 24)!
    RecordingService.appendOutput(recorder, 'data')
    RecordingService.stop(recorder)

    expect(RecordingService.has('log-4')).toBe(true)
    expect(RecordingService.has('missing')).toBe(false)

    const recording = RecordingService.openRead('log-4')!
    expect(recording.size).toBeGreaterThan(0)
    // Consume the stream fully so the fd closes cleanly.
    await new Promise<void>((resolve) => {
      recording.stream.on('close', resolve)
      recording.stream.on('data', () => {})
    })
    expect(RecordingService.openRead('missing')).toBeUndefined()
  })

  it('purges only recording files older than the retention window', async () => {
    const recorder = RecordingService.start('old', makeHost(), 80, 24)!
    RecordingService.appendOutput(recorder, 'old data')
    RecordingService.stop(recorder)
    const recorder2 = RecordingService.start('fresh', makeHost(), 80, 24)!
    RecordingService.stop(recorder2)
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'not a recording')

    // Backdate "old" past the retention window.
    const past = new Date(Date.now() - (env.RECORDING_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000)
    fs.utimesSync(path.join(dir, 'old.cast'), past, past)

    const deleted = await RecordingService.purgeExpired()
    expect(deleted).toBe(1)
    expect(fs.existsSync(path.join(dir, 'old.cast'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'fresh.cast'))).toBe(true)
    // Non-recording files are left alone.
    expect(fs.existsSync(path.join(dir, 'notes.txt'))).toBe(true)
  })
})
