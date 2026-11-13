import fs from 'node:fs'
import { Readable } from 'node:stream'

import { Client, SFTPWrapper } from 'ssh2'

import logger from '@common/config/logger'
import { SshErrorCode } from '@common/constants'
import { ForbiddenError, BadRequestError, ConflictError, NotFoundError, AppError } from '@common/errors'

import SshService, { SshError } from '@modules/hosts/ssh.service'

import { Host } from '@entities/host.entity'

import { basename } from './sftp-path'

type EntryType = 'file' | 'directory' | 'symlink' | 'other'

export type SftpEntry = {
  name: string
  type: EntryType
  size: number
  modifiedAt: string
  permissions: string
}

type SftpNameEntry = { filename: string; longname: string; attrs: { size: number; mtime: number } }

const typeFromLongname = (longname: string): EntryType => {
  const kind = longname[0]
  if (kind === 'd') return 'directory'
  if (kind === 'l') return 'symlink'
  if (kind === '-') return 'file'
  return 'other'
}

// ─── Error mapping: missing → 404, permission → 403, everything else → 502 ──
// ssh2 SFTP errors carry numeric status codes (2 = no such file, 3 = permission denied).

const toHttpError = (err: unknown): unknown => {
  const code = (err as { code?: string | number }).code
  if (code === 2 || code === 'ENOENT') return new NotFoundError('No such file or directory')
  if (code === 3 || code === 'EACCES' || code === 'EPERM') return new ForbiddenError('Permission denied')
  if (code === 'ENOTEMPTY') return new BadRequestError('Directory not empty')
  if (code === 'EEXIST') return new ConflictError('Already exists')
  if (err instanceof AppError) return err
  // Never leak the underlying SSH error details to the client.
  return new SshError(SshErrorCode.CONNECTION_FAILED, 'SFTP operation failed')
}

const sftpCall = <T>(run: (cb: (err: Error | null | undefined, value: T) => void) => void): Promise<T> =>
  new Promise((resolve, reject) => {
    run((err, value) => (err ? reject(err) : resolve(value)))
  })

// ─── Small connection cache: one SSH channel per (userId, hostId), closed when idle ──

const SFTP_IDLE_CLOSE_MS = 60_000
const SFTP_SWEEP_INTERVAL_MS = 15_000

type PooledConnection = { client: Client; sftp: SFTPWrapper; lastUsed: number }
const pool = new Map<string, PooledConnection>()
const poolKey = (host: Host) => `${host.userId}:${host.id}`

let sweeper: NodeJS.Timeout | undefined

const evict = (key: string) => {
  const pooled = pool.get(key)
  if (!pooled) return
  pool.delete(key)
  pooled.sftp.removeAllListeners()
  if (pooled.client) {
    pooled.client.removeAllListeners()
    // ssh2 crashes the process on an unhandled 'error' event, so keep one while ending.
    pooled.client.on('error', () => {})
    pooled.client.end()
  }
}

const ensureSweeper = () => {
  if (sweeper) return
  sweeper = setInterval(() => {
    const now = Date.now()
    for (const [key, pooled] of pool) {
      if (now - pooled.lastUsed > SFTP_IDLE_CLOSE_MS) evict(key)
    }
  }, SFTP_SWEEP_INTERVAL_MS)
  sweeper.unref()
}

class SftpService {
  /** Reuses a warm connection (≤60s idle) instead of reconnecting per request. */
  private static async acquire(host: Host): Promise<SFTPWrapper> {
    const key = poolKey(host)
    const pooled = pool.get(key)
    if (pooled) {
      pooled.lastUsed = Date.now()
      return pooled.sftp
    }

    // SshService.connect enforces the SSRF guard and the trusted host key.
    const client = await SshService.connect(host)
    const sftp = await sftpCall<SFTPWrapper>((cb) => client.sftp(cb))

    const entry: PooledConnection = { client, sftp, lastUsed: Date.now() }
    pool.set(key, entry)
    sftp.on('close', () => evict(key))
    sftp.on('error', (err: Error) => {
      logger.warn({ hostId: host.id, err: err.message }, 'SFTP connection error')
      evict(key)
    })
    client.on('close', () => evict(key))

    ensureSweeper()
    return sftp
  }

  static async list(host: Host, remotePath: string): Promise<{ path: string; entries: SftpEntry[] }> {
    try {
      const sftp = await this.acquire(host)
      const names = await sftpCall<SftpNameEntry[]>((cb) => sftp.readdir(remotePath === '.' ? '.' : remotePath, cb))
      const entries = names.map((name) => ({
        name: name.filename,
        type: typeFromLongname(name.longname),
        size: name.attrs.size,
        modifiedAt: new Date(name.attrs.mtime * 1000).toISOString(),
        // First token of the long format, e.g. "drwxr-xr-x".
        permissions: name.longname.trim().split(/\s+/)[0] ?? ''
      }))
      // Directories first, then a case-insensitive name sort.
      entries.sort((a, b) => {
        const dirDiff = Number(b.type === 'directory') - Number(a.type === 'directory')
        return dirDiff !== 0 ? dirDiff : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
      return { path: remotePath, entries }
    } catch (err) {
      throw toHttpError(err)
    }
  }

  static async openReadStream(
    host: Host,
    remotePath: string
  ): Promise<{ stream: Readable; size: number; fileName: string }> {
    try {
      const sftp = await this.acquire(host)
      const stats = await sftpCall<{ size: number }>((cb) => sftp.stat(remotePath, cb))
      return { stream: sftp.createReadStream(remotePath), size: stats.size, fileName: basename(remotePath) }
    } catch (err) {
      throw toHttpError(err)
    }
  }

  /** Uploads a local temp file, then always removes the temp file. */
  static async upload(host: Host, localPath: string, remotePath: string): Promise<void> {
    try {
      const sftp = await this.acquire(host)
      await sftpCall<void>((cb) => sftp.fastPut(localPath, remotePath, cb))
    } catch (err) {
      throw toHttpError(err)
    } finally {
      await fs.promises.unlink(localPath).catch(() => {})
    }
  }

  static async rename(host: Host, from: string, to: string): Promise<void> {
    try {
      const sftp = await this.acquire(host)
      await sftpCall<void>((cb) => sftp.rename(from, to, cb))
    } catch (err) {
      throw toHttpError(err)
    }
  }

  static async mkdir(host: Host, remotePath: string): Promise<void> {
    try {
      const sftp = await this.acquire(host)
      // OpenSSH reports "already exists" as a plain failure (code 4), so check first
      // and answer 409 instead of a generic 502.
      const exists = await sftpCall<boolean>((cb) => sftp.stat(remotePath, (err) => cb(null, !err)))
      if (exists) throw new ConflictError('Already exists')
      await sftpCall<void>((cb) => sftp.mkdir(remotePath, cb))
    } catch (err) {
      throw toHttpError(err)
    }
  }

  /** Removes a file, or a directory (recursively when requested). */
  static async remove(host: Host, remotePath: string, recursive: boolean): Promise<void> {
    try {
      const sftp = await this.acquire(host)
      const stats = await sftpCall<{ isDirectory: () => boolean }>((cb) => sftp.lstat(remotePath, cb))
      if (!stats.isDirectory()) {
        await sftpCall<void>((cb) => sftp.unlink(remotePath, cb))
        return
      }
      if (!recursive) {
        await sftpCall<void>((cb) => sftp.rmdir(remotePath, cb))
        return
      }

      // No recursive delete in SFTP: walk the tree top-down.
      const names = await sftpCall<SftpNameEntry[]>((cb) => sftp.readdir(remotePath, cb))
      for (const name of names) {
        const child = `${remotePath === '.' ? '' : remotePath + '/'}${name.filename}`
        await this.remove(host, child, true)
      }
      await sftpCall<void>((cb) => sftp.rmdir(remotePath, cb))
    } catch (err) {
      throw toHttpError(err)
    }
  }

  /** Called on graceful shutdown: closes every pooled connection. */
  static closeAll(): void {
    if (sweeper) clearInterval(sweeper)
    sweeper = undefined
    for (const key of [...pool.keys()]) evict(key)
  }
}

export default SftpService
