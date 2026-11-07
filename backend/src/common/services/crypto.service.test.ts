import crypto from 'node:crypto'

import { describe, expect, it } from 'vitest'

import CryptoService, { decryptWithKey, encryptWithKey } from './crypto.service'

describe('CryptoService', () => {
  it('round-trips plain text, including unicode', () => {
    for (const plain of ['hunter2', 'mật khẩu tiếng Việt 🔑', '-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n']) {
      expect(CryptoService.decrypt(CryptoService.encrypt(plain))).toBe(plain)
    }
  })

  it('uses the v1 format and a fresh IV each time', () => {
    const a = CryptoService.encrypt('same')
    const b = CryptoService.encrypt('same')
    expect(a.startsWith('v1:')).toBe(true)
    expect(a.split(':')).toHaveLength(4)
    expect(a).not.toBe(b)
  })

  it('rejects tampered data', () => {
    const [v, iv, tag, data] = CryptoService.encrypt('secret value').split(':')
    const bytes = Buffer.from(data, 'base64')
    bytes[0] ^= 0xff
    const tampered = [v, iv, tag, bytes.toString('base64')].join(':')
    expect(() => CryptoService.decrypt(tampered)).toThrow('Decryption failed')
  })

  it('rejects a wrong key', () => {
    const payload = encryptWithKey('secret', crypto.randomBytes(32))
    expect(() => decryptWithKey(payload, crypto.randomBytes(32))).toThrow('Decryption failed')
  })

  it('rejects malformed payloads', () => {
    expect(() => CryptoService.decrypt('not-a-payload')).toThrow('Invalid encrypted payload format')
    expect(() => CryptoService.decrypt('v2:a:b:c')).toThrow('Invalid encrypted payload format')
  })
})
