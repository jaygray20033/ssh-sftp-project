import crypto from 'node:crypto'

import env from '@common/config/env'

const VERSION = 'v1'
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32

/**
 * Format: v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>
 * AES-256-GCM, random 12-byte IV per message. Throws a generic error on any failure so that
 * nothing about the key or plaintext leaks through error messages.
 */
export function encryptWithKey(plain: string, key: Buffer): string {
  if (key.length !== KEY_LENGTH) throw new Error('Encryption key must be 32 bytes')
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decryptWithKey(payload: string, key: Buffer): string {
  if (key.length !== KEY_LENGTH) throw new Error('Encryption key must be 32 bytes')
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Invalid encrypted payload format')

  try {
    const iv = Buffer.from(parts[1], 'base64')
    const tag = Buffer.from(parts[2], 'base64')
    const data = Buffer.from(parts[3], 'base64')
    if (iv.length !== IV_LENGTH) throw new Error('bad iv')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    throw new Error('Decryption failed')
  }
}

class CryptoService {
  private static get key(): Buffer {
    return Buffer.from(env.ENCRYPTION_KEY, 'base64')
  }

  static encrypt(plain: string): string {
    return encryptWithKey(plain, this.key)
  }

  static decrypt(payload: string): string {
    return decryptWithKey(payload, this.key)
  }
}

export default CryptoService
