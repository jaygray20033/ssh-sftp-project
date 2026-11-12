import { describe, expect, it } from 'vitest'

import { BadRequestError } from '@common/errors'

import { basename, normalizeSftpPath } from './sftp-path'

describe('normalizeSftpPath', () => {
  it('treats empty as the home directory', () => {
    expect(normalizeSftpPath('')).toBe('.')
    expect(normalizeSftpPath('  ')).toBe('.')
    expect(normalizeSftpPath(undefined)).toBe('.')
  })

  it('normalizes relative paths', () => {
    expect(normalizeSftpPath('docs')).toBe('docs')
    expect(normalizeSftpPath('docs/./sub')).toBe('docs/sub')
    expect(normalizeSftpPath('docs/sub/../file.txt')).toBe('docs/file.txt')
    expect(normalizeSftpPath('./a')).toBe('a')
    expect(normalizeSftpPath('a//b')).toBe('a/b')
  })

  it('rejects NUL bytes', () => {
    expect(() => normalizeSftpPath('a\0b')).toThrow(BadRequestError)
  })

  it('rejects paths that escape the home directory', () => {
    expect(() => normalizeSftpPath('..')).toThrow(BadRequestError)
    expect(() => normalizeSftpPath('a/../../etc')).toThrow(BadRequestError)
    expect(() => normalizeSftpPath('../../etc/passwd')).toThrow(BadRequestError)
  })

  it('allows staying inside via ..', () => {
    expect(normalizeSftpPath('docs/..')).toBe('.')
    expect(normalizeSftpPath('a/../b')).toBe('b')
  })

  it('rejects absolute paths', () => {
    expect(() => normalizeSftpPath('/etc/passwd')).toThrow(BadRequestError)
  })
})

describe('basename', () => {
  it('returns the last segment', () => {
    expect(basename('docs/file.txt')).toBe('file.txt')
    expect(basename('docs')).toBe('docs')
    expect(basename('.')).toBe('.')
  })
})
