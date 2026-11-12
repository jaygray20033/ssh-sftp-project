import crypto from 'node:crypto'

import { StatusCodes } from 'http-status-codes'
import NodeCache from 'node-cache'
import { Client } from 'ssh2'

import logger from '@common/config/logger'
import {
  AuthType,
  SSH_KEEPALIVE_INTERVAL_MS,
  SSH_READY_TIMEOUT_MS,
  SshErrorCode
} from '@common/constants/host.constant'
import { AppError } from '@common/errors'
import { CryptoService } from '@common/services'
import { resolveAllowedHostIp } from '@common/utils/network-guard'

import { Host } from '@entities/host.entity'

import HostRepository from './host.repository'

export class SshError extends AppError {
  constructor(
    public code: SshErrorCode,
    message: string,
    public fingerprint?: string
  ) {
    super(StatusCodes.BAD_GATEWAY, message)
  }
}

export type TestHostResult =
  | { ok: true; fingerprint: string | null; latencyMs: number }
  | { ok: false; code: SshErrorCode; message: string; fingerprint?: string }

// SHA256:<base64 without padding>, same format as `ssh-keygen -lf`
export const getFingerprint = (key: Buffer) =>
  `SHA256:${crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}`

// Last host key seen per user+host, so trust-host-key only accepts what the user was shown.
const seenKeys = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false })
const cacheKey = (userId: string, hostId: string) => `${userId}:${hostId}`

type ConnectError = Error & { level?: string; code?: string }

const toSshError = (err: ConnectError): SshError => {
  if (err.level === 'client-authentication') {
    return new SshError(SshErrorCode.AUTH_FAILED, 'Authentication failed')
  }
  if (err.level === 'client-timeout' || err.code === 'ETIMEDOUT') {
    return new SshError(SshErrorCode.TIMEOUT, 'Connection timed out')
  }
  if (err.code === 'ECONNREFUSED') {
    return new SshError(SshErrorCode.REFUSED, 'Connection refused')
  }
  if (/privateKey|passphrase/i.test(err.message)) {
    return new SshError(SshErrorCode.AUTH_FAILED, 'Invalid private key or passphrase')
  }
  return new SshError(SshErrorCode.CONNECTION_FAILED, 'Could not connect to host')
}

class SshService {
  // Credentials are decrypted here, right before connecting, and never stored.
  static async connect(host: Host): Promise<Client> {
    // Resolve now and connect to the IP: blocks SSRF targets and DNS rebinding.
    const targetIp = await resolveAllowedHostIp(host.hostname)
    return new Promise((resolve, reject) => {
      const client = new Client()
      let hostKeyError: SshError | undefined

      try {
        const secret = CryptoService.decrypt(host.encryptedSecret)
        const isPassword = host.authType === AuthType.PASSWORD
        const passphrase = host.encryptedPassphrase ? CryptoService.decrypt(host.encryptedPassphrase) : undefined

        client.on('ready', () => resolve(client))
        client.on('error', (err: ConnectError) => {
          client.end()
          if (!hostKeyError)
            logger.warn({ hostId: host.id, errCode: err.code, sshLevel: err.level }, 'SSH connect failed')
          reject(hostKeyError ?? toSshError(err))
        })
        if (isPassword) {
          client.on('keyboard-interactive', (_name, _instructions, _lang, prompts, finish) => {
            finish(prompts.map(() => secret))
          })
        }

        client.connect({
          host: targetIp,
          port: host.port,
          username: host.username,
          password: isPassword ? secret : undefined,
          privateKey: isPassword ? undefined : secret,
          passphrase,
          tryKeyboard: isPassword,
          readyTimeout: SSH_READY_TIMEOUT_MS,
          keepaliveInterval: SSH_KEEPALIVE_INTERVAL_MS,
          hostVerifier: (key: Buffer) => {
            const fingerprint = getFingerprint(key)
            if (host.hostKeyFingerprint === fingerprint) return true

            seenKeys.set(cacheKey(host.userId, host.id), fingerprint)
            hostKeyError = host.hostKeyFingerprint
              ? new SshError(SshErrorCode.HOST_KEY_CHANGED, 'Host key has changed', fingerprint)
              : new SshError(SshErrorCode.HOST_KEY_UNVERIFIED, 'Host key is not trusted yet', fingerprint)
            return false
          }
        })
      } catch (err) {
        client.end()
        reject(err instanceof SshError ? err : toSshError(err as ConnectError))
      }
    })
  }

  static exec(client: Client, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) return reject(new SshError(SshErrorCode.CONNECTION_FAILED, 'Could not run command'))
        let output = ''
        stream.on('data', (chunk: Buffer) => (output += chunk.toString()))
        stream.on('close', () => resolve(output))
      })
    })
  }

  static async testConnection(host: Host): Promise<TestHostResult> {
    const startedAt = Date.now()
    try {
      const client = await this.connect(host)
      try {
        const output = await this.exec(client, 'echo ok')
        if (output.trim() !== 'ok') throw new SshError(SshErrorCode.CONNECTION_FAILED, 'Unexpected response from host')
      } finally {
        client.end()
      }
      await HostRepository.update(host.id, host.userId, { lastConnectedAt: new Date() })
      return { ok: true, fingerprint: host.hostKeyFingerprint, latencyMs: Date.now() - startedAt }
    } catch (err) {
      if (err instanceof SshError) {
        return { ok: false, code: err.code, message: err.message, fingerprint: err.fingerprint }
      }
      throw err
    }
  }

  static getSeenFingerprint(userId: string, hostId: string) {
    return seenKeys.get<string>(cacheKey(userId, hostId))
  }

  static clearSeenFingerprint(userId: string, hostId: string) {
    seenKeys.del(cacheKey(userId, hostId))
  }
}

export default SshService
