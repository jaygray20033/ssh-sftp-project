import type { SftpEntry } from '@lib/types'

// SFTP paths are relative to the SSH user's home; '' means home.

export function fullPath(dir: string, name: string): string {
  return dir ? `${dir}/${name}` : name
}

export function parentDir(dir: string): string {
  const cut = dir.lastIndexOf('/')
  return cut === -1 ? '' : dir.slice(0, cut)
}

export function pathSegments(dir: string): string[] {
  return dir.split('/').filter(Boolean)
}

// B08 throws 400 with this prefix before the host key is trusted.
export function isHostKeyError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('HOST_KEY_UNVERIFIED')
}

export const MAX_EDIT_SIZE = 1024 * 1024

const TEXT_EXTENSIONS =
  /\.(txt|md|markdown|log|json|ya?ml|toml|ini|cfg|conf|env|csv|tsv|xml|html?|css|scss|sh|bash|zsh|py|rb|js|mjs|cjs|jsx|ts|tsx|go|rs|c|h|cpp|hpp|java|sql|php|lua|vim)$/i

// P2 editor: only small plain-text candidates open in the textarea.
export function isProbablyText(entry: SftpEntry): boolean {
  if (entry.type !== 'file' || entry.size >= MAX_EDIT_SIZE) return false
  // Files without an extension (README, Makefile) are usually text too.
  return TEXT_EXTENSIONS.test(entry.name) || !entry.name.includes('.')
}
