import path from 'node:path'

import { BadRequestError } from '@common/errors'

/**
 * Normalize an SFTP path. Paths are relative to the SSH user's home directory:
 * "" and "." mean home, ".." moves up but must never escape above it.
 */
export const normalizeSftpPath = (raw: string | undefined): string => {
  if (raw === undefined || raw.trim() === '') return '.'

  if (raw.includes('\0')) throw new BadRequestError('Invalid path')
  if (path.posix.isAbsolute(raw)) throw new BadRequestError('Path must be relative to the home directory')

  const normalized = path.posix.normalize(raw)
  // normalize('..') === '..' and normalize('a/../../b') starts with '..'.
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new BadRequestError('Path escapes the home directory')
  }

  return normalized
}

/** Last segment of a normalized path ('.' stays '.'). */
export const basename = (normalized: string): string => {
  if (normalized === '.') return '.'
  const name = path.posix.basename(normalized)
  return name === '' ? '/' : name
}
