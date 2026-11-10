export interface ApiErrorBody {
  statusCode: number
  message: string
  path?: string
  timestamp?: string
}

export interface AuthUser {
  id: string
  username: string | null
  email: string
  fullName: string
  role: 'user' | 'admin'
  googleId: string | null
  avatarUrl: string | null
  isTwoFactorEnabled: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
}

export interface TwoFactorRequired {
  requiresTwoFactor: true
  pendingToken: string
}

export interface TwoFactorSetup {
  otpauthUrl: string
  setUpToken: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export interface LoginPasswordRequest {
  email: string
  password: string
}

export interface Login2FARequest {
  email?: string
  password?: string
  pendingToken: string
  code: string
}

export type LoginRequest = LoginPasswordRequest | Login2FARequest

export interface GoogleOAuthUrlResponse {
  url: string
}

export interface GoogleCallbackRequest {
  code: string
  state: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface Confirm2FARequest {
  code: string
  setUpToken: string
}

export interface Disable2FARequest {
  code: string
}

export interface UpdateProfileRequest {
  username?: string
  fullName?: string
  avatarUrl?: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── Hosts ───────────────────────────────────────────────────────────────────

export type AuthType = 'password' | 'private_key'

// Secrets are never returned by the API: only the has* flags.
export interface Host {
  id: string
  name: string
  hostname: string
  port: number
  username: string
  authType: AuthType
  tags: string[]
  hasSecret: boolean
  hasPassphrase: boolean
  hostKeyFingerprint: string | null
  lastConnectedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateHostRequest {
  name: string
  hostname: string
  port: number
  username: string
  authType: AuthType
  secret: string
  passphrase?: string
  tags?: string[]
}

// Omit `secret` to keep the stored one; `passphrase: null` removes it.
export type UpdateHostRequest = Partial<Omit<CreateHostRequest, 'passphrase'>> & { passphrase?: string | null }

export interface PaginatedHosts {
  entries: Host[]
  limit: number
  offset: number
  total_count?: number
}

export type SshErrorCode =
  'AUTH_FAILED' | 'TIMEOUT' | 'REFUSED' | 'HOST_KEY_CHANGED' | 'HOST_KEY_UNVERIFIED' | 'CONNECTION_FAILED'

// A failed test still comes back as HTTP 200 with ok: false.
export type TestHostResult =
  | { ok: true; fingerprint: string | null; latencyMs: number }
  | { ok: false; code: SshErrorCode; message: string; fingerprint?: string }

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface SessionLog {
  id: string
  // null when the host was deleted after the session.
  hostId: string | null
  hostLabel: string
  startedAt: string
  endedAt: string | null
  clientIp: string
  closeReason: string | null
}

export interface PaginatedSessionLogs {
  entries: SessionLog[]
  limit: number
  offset: number
  total_count?: number
}

// ─── SFTP ────────────────────────────────────────────────────────────────────

export type SftpEntryType = 'file' | 'directory' | 'symlink' | 'other'

export interface SftpEntry {
  name: string
  type: SftpEntryType
  size: number
  modifiedAt: string
  // Long format, e.g. drwxr-xr-x.
  permissions: string
}
