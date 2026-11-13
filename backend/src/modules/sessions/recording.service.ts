import fs from 'node:fs'
import path from 'node:path'

import env from '@common/config/env'
import logger from '@common/config/logger'
import { TERMINAL_TERM } from '@common/constants'

import { Host } from '@entities/host.entity'

export type Recorder = {
  filePath: string
  fd: number
  startedAt: number
  writtenBytes: number
  // Set once the size cap is hit: further output is dropped, the file stays valid.
  capped: boolean
}

const byteLength = (data: string) => Buffer.byteLength(data, 'utf8')

class RecordingService {
  static get dir() {
    return path.resolve(env.RECORDINGS_DIR)
  }

  /** asciicast v2 (asciinema) file named after the session log id. */
  static filePath(sessionLogId: string) {
    return path.join(this.dir, `${sessionLogId}.cast`)
  }

  /**
   * Starts an opt-in recording. Header line per asciicast v2:
   * {"version":2,"width":..,"height":..,"timestamp":..,"env":{"TERM":..},"title":..}
   * Writes are synchronous: terminal output is small and this keeps the file
   * consistent the moment close() runs.
   */
  static start(sessionLogId: string, host: Host, cols: number, rows: number): Recorder | undefined {
    try {
      fs.mkdirSync(this.dir, { recursive: true })
      const filePath = this.filePath(sessionLogId)
      const header = {
        version: 2,
        width: cols,
        height: rows,
        timestamp: Math.floor(Date.now() / 1000),
        env: { SHELL: '/bin/bash', TERM: TERMINAL_TERM },
        title: host.name
      }
      const fd = fs.openSync(filePath, 'w')
      const headerLine = `${JSON.stringify(header)}\n`
      fs.writeSync(fd, headerLine)

      return {
        filePath,
        fd,
        startedAt: Date.now(),
        writtenBytes: byteLength(headerLine),
        capped: false
      }
    } catch (err) {
      // Recording must never break the terminal session.
      logger.warn({ hostId: host.id, sessionLogId, err }, 'Could not start session recording')
      return undefined
    }
  }

  /** Appends one output event: [<seconds>,"o",<text>] per line. */
  static appendOutput(recorder: Recorder, data: string): void {
    if (recorder.capped) return

    const elapsed = Math.round(((Date.now() - recorder.startedAt) / 1000) * 1_000_000) / 1_000_000
    const line = `${JSON.stringify([elapsed, 'o', data])}\n`

    if (recorder.writtenBytes + byteLength(line) > env.RECORDING_MAX_SIZE_MB * 1024 * 1024) {
      recorder.capped = true
      logger.warn({ filePath: recorder.filePath }, 'Recording size cap reached, stopping capture')
      this.stop(recorder)
      return
    }

    recorder.writtenBytes += byteLength(line)
    fs.writeSync(recorder.fd, line)
  }

  static stop(recorder: Recorder): void {
    try {
      fs.closeSync(recorder.fd)
    } catch {
      // Already closed.
    }
  }

  /** True when a recording file exists for this session log. */
  static has(sessionLogId: string): boolean {
    try {
      return fs.existsSync(this.filePath(sessionLogId))
    } catch {
      return false
    }
  }

  /** Read stream for GET /sessions/:id/recording; undefined when there is none. */
  static openRead(sessionLogId: string): { stream: fs.ReadStream; size: number } | undefined {
    const filePath = this.filePath(sessionLogId)
    try {
      const stats = fs.statSync(filePath)
      return { stream: fs.createReadStream(filePath), size: stats.size }
    } catch {
      return undefined
    }
  }

  /** Retention: delete recording files older than RECORDING_RETENTION_DAYS. */
  static async purgeExpired(): Promise<number> {
    const cutoff = Date.now() - env.RECORDING_RETENTION_DAYS * 24 * 60 * 60 * 1000
    try {
      const names = fs.readdirSync(this.dir)
      let deleted = 0
      for (const name of names) {
        if (!name.endsWith('.cast')) continue
        const filePath = path.join(this.dir, name)
        try {
          if (fs.statSync(filePath).mtimeMs < cutoff) {
            fs.unlinkSync(filePath)
            deleted++
          }
        } catch {
          // A file disappearing mid-scan is fine.
        }
      }
      return deleted
    } catch {
      // No recordings dir yet.
      return 0
    }
  }
}

export default RecordingService
