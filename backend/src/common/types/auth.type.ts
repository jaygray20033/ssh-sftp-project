import { UserRole } from '@common/constants'

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthUser = {
  id: string
  username?: string | null
  email: string
  fullName: string
  role: UserRole
  googleId?: string | null
  avatarUrl?: string | null
  isEmailVerified: boolean
  isTwoFactorEnabled: boolean
}

export type AuthResponse = AuthTokens & {
  user: AuthUser
}

export type AccessTokenPayload = {
  sub: string
  email: string
  role: string
}

export type RefreshTokenPayload = {
  sub: string
}

export type GoogleTokenResponse = {
  access_token: string
  token_type: string
}

export type GoogleUserInfo = {
  id: string
  email: string
  verified_email: boolean
  name: string
  picture?: string
}

export type LoginResult =
  { requiresTwoFactor: true; pendingToken: string } | (AuthResponse & { requiresTwoFactor: false })

export type GoogleProfile = {
  googleId: string
  email: string
  fullName: string
  avatarUrl?: string | null
}

export type EmailParams = {
  name: string
  appName: string
  supportEmail: string
  expireMinutes: number
}

export type VerifyEmailParams = EmailParams & {
  verifyUrl: string
}

export type ResetPasswordParams = EmailParams & {
  code: string
}
