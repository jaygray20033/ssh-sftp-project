import bcrypt from 'bcrypt'
import { instanceToPlain } from 'class-transformer'
import { generateSecret, generateURI, verifySync } from 'otplib'

import { env } from '@common/config'
import {
  AUTH_TOKEN,
  GOOGLE_AUTH,
  RESET_PASSWORD_EXPIRE_MINUTES,
  SALT_ROUNDS,
  VERIFY_EMAIL_EXPIRE_MINUTES
} from '@common/constants'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '@common/errors'
import { EmailService, JWTService } from '@common/services'
import { AuthResponse, AuthUser, GoogleProfile, LoginResult } from '@common/types'
import { comparePassword } from '@common/utils/password'
import { generateRandomDigits, generateSecureToken, hashAuthToken } from '@common/utils/random'

import { User } from '@entities/user.entity'

import AuthCacheService from './auth-cache.service'
import AuthRepository from './auth.repository'
import { LoginBody, RegisterBody } from './dto'

class AuthService {
  private static emailService = new EmailService()

  static async setup2FA(userId: string): Promise<{ otpauthUrl: string; setUpToken: string }> {
    const user = await AuthRepository.findByIdWithTwoFactorSecret(userId)
    if (!user) throw new NotFoundError('User not found')
    if (!user.isEmailVerified) throw new ForbiddenError('Email must be verified before enabling 2FA')
    if (user.isTwoFactorEnabled) throw new ConflictError('2FA is already enabled')

    const secret = generateSecret()
    const otpauthUrl = generateURI({ label: user.email, issuer: env.APP_NAME, secret })

    const setUpToken = AuthCacheService.generateTwoFactorToken(userId, secret)

    return { otpauthUrl, setUpToken }
  }

  static async confirm2FA(userId: string, code: string, setUpToken: string): Promise<void> {
    const tokenData = AuthCacheService.getTwoFactorTokenData(setUpToken)
    if (!tokenData || tokenData.userId !== userId) throw new UnauthorizedError('Invalid or expired setup session')

    const user = await AuthRepository.findByIdWithTwoFactorSecret(userId)
    if (!user) throw new NotFoundError('User not found')
    if (user.isTwoFactorEnabled) throw new ConflictError('2FA is already enabled')

    const { valid } = verifySync({ token: code, secret: tokenData.secret })
    if (!valid) throw new BadRequestError('Invalid 2FA code')

    AuthCacheService.consumeTwoFactorToken(setUpToken)
    await AuthRepository.saveTwoFactorSecretAndEnable(userId, tokenData.secret)
  }

  static async disable2FA(userId: string, code: string): Promise<void> {
    const user = await AuthRepository.findByIdWithTwoFactorSecret(userId)
    if (!user) throw new NotFoundError('User not found')
    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) throw new BadRequestError('2FA is not enabled')

    const { valid } = verifySync({ token: code, secret: user.twoFactorSecret })
    if (!valid) throw new BadRequestError('Invalid 2FA code')

    await AuthRepository.disableTwoFactor(userId)
  }

  static async register(dto: RegisterBody): Promise<AuthUser> {
    const [existingEmail, existingUsername] = await Promise.all([
      AuthRepository.findByEmail(dto.email),
      AuthRepository.findByUsername(dto.username)
    ])

    if (existingEmail) throw new ConflictError('Email is already in use')
    if (existingUsername) throw new ConflictError('Username is already in use')

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS)
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + VERIFY_EMAIL_EXPIRE_MINUTES * 60 * 1000)

    const newUser = await AuthRepository.createUserWithVerifyToken(
      { ...dto, password: hashedPassword },
      { tokenHash: hashAuthToken(token), expiresAt, type: AUTH_TOKEN.VERIFY_EMAIL }
    )

    await AuthService.emailService.sendVerifyEmail(newUser.email, token, newUser.fullName)

    return instanceToPlain(newUser) as AuthUser
  }

  static async logout(refreshToken: string): Promise<void> {
    const refreshTokenHash = JWTService.hashRefreshToken(refreshToken)
    await AuthRepository.deleteRefreshToken(refreshTokenHash)
  }

  static async refreshToken(
    currentRefreshToken: string,
    userId: string
  ): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
    const refreshTokenHash = JWTService.hashRefreshToken(currentRefreshToken)
    const storedToken = await AuthRepository.findRefreshToken(refreshTokenHash)
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token')
    }

    if (storedToken.absoluteExpiresAt < new Date()) {
      throw new UnauthorizedError('Session expired. Please login again.')
    }

    await AuthRepository.deleteRefreshTokenById(storedToken.id)

    const user = await AuthRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const accessToken = JWTService.generateAccessToken({ sub: user.id, email: user.email, role: user.role })
    const newRefreshToken = JWTService.generateRefreshToken({ sub: user.id })
    const newRefreshTokenHash = JWTService.hashRefreshToken(newRefreshToken)

    await AuthRepository.saveRefreshToken({
      tokenHash: newRefreshTokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + Number(env.JWT_REFRESH_EXPIRES_IN) * 1000),
      absoluteExpiresAt: storedToken.absoluteExpiresAt
    })

    return { accessToken, refreshToken: newRefreshToken }
  }

  static createGoogleAuthUrl(): { url: string; state: string } {
    const state = AuthCacheService.generateOAuthState()
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: GOOGLE_AUTH.SCOPE,
      prompt: 'select_account',
      state
    })
    return { url: `${GOOGLE_AUTH.URL}?${params.toString()}`, state }
  }

  static verifyOAuthState(state: string): void {
    if (!AuthCacheService.consumeOAuthState(state)) {
      throw new UnauthorizedError('Invalid or expired OAuth state. Please try again.')
    }
  }

  static async verifyGoogleCallback(profile: GoogleProfile): Promise<LoginResult> {
    const existingUser = await AuthRepository.findByEmail(profile.email)

    if (existingUser) {
      if (existingUser.googleId && existingUser.googleId !== profile.googleId) {
        throw new ForbiddenError('This email is already linked to a different Google account.')
      }

      if (!existingUser.googleId) {
        throw new ConflictError(
          'An account with this email already exists. Please log in with your password and link Google from your account settings.'
        )
      }

      await AuthRepository.updateGoogleProfile(existingUser.id, {
        avatarUrl: existingUser.avatarUrl ?? profile.avatarUrl ?? undefined
      })

      if (existingUser.isTwoFactorEnabled) {
        const pendingToken = AuthCacheService.generatePendingLoginToken(existingUser.id)
        return { requiresTwoFactor: true, pendingToken }
      }

      const { accessToken, refreshToken } = await AuthService.generateTokens(existingUser)
      const user = instanceToPlain(existingUser) as AuthUser
      return { requiresTwoFactor: false, accessToken, refreshToken, user }
    }

    const newUser = await AuthRepository.createOAuthUser({
      email: profile.email,
      fullName: profile.fullName,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl
    })

    const { accessToken, refreshToken } = await AuthService.generateTokens(newUser)
    const user = instanceToPlain(newUser) as AuthUser
    return { requiresTwoFactor: false, accessToken, refreshToken, user }
  }

  static async verifyTwoFactorLoginToken(pendingToken: string, code: string): Promise<AuthResponse> {
    const userId = AuthCacheService.peekPendingLoginToken(pendingToken)
    if (!userId) throw new UnauthorizedError('Invalid or expired 2FA session')

    const user = await AuthRepository.findByIdWithTwoFactorSecret(userId)
    if (!user || !user.twoFactorSecret) throw new NotFoundError('User not found')

    const { valid } = verifySync({ token: code, secret: user.twoFactorSecret })
    if (!valid) throw new BadRequestError('Invalid 2FA code')

    AuthCacheService.consumePendingLoginToken(pendingToken)
    const { accessToken, refreshToken } = await AuthService.generateTokens(user)
    return { accessToken, refreshToken, user: instanceToPlain(user) as AuthUser }
  }

  static async verifyEmail(token: string): Promise<void> {
    const authToken = await AuthRepository.findAuthToken(hashAuthToken(token), AUTH_TOKEN.VERIFY_EMAIL)
    if (!authToken || authToken.expiresAt < new Date() || authToken.usedAt) {
      throw new BadRequestError('Invalid or expired token')
    }

    await Promise.all([
      AuthRepository.markAuthTokenUsed(authToken.id),
      AuthRepository.markEmailVerified(authToken.userId)
    ])
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await AuthRepository.findByEmailWithPassword(email)
    if (!user || !user.password || !user.isEmailVerified) return

    const otp = generateRandomDigits(6)
    const expiresAt = new Date(Date.now() + RESET_PASSWORD_EXPIRE_MINUTES * 60 * 1000)

    await AuthRepository.deleteUserAuthTokensByType(user.id, AUTH_TOKEN.RESET_PASSWORD)
    await AuthRepository.createAuthToken({
      tokenHash: hashAuthToken(otp),
      userId: user.id,
      type: AUTH_TOKEN.RESET_PASSWORD,
      expiresAt
    })
    await this.emailService.sendResetPasswordEmail(user.email, otp)
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const authToken = await AuthRepository.findAuthToken(hashAuthToken(token), AUTH_TOKEN.RESET_PASSWORD)
    if (!authToken || authToken.expiresAt < new Date() || authToken.usedAt) {
      throw new BadRequestError('Invalid or expired token')
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await Promise.all([
      AuthRepository.markAuthTokenUsed(authToken.id),
      AuthRepository.updatePassword(authToken.userId, hashedPassword)
    ])
    await AuthRepository.deleteAllRefreshTokensByUserId(authToken.userId)
  }

  static async login(dto: LoginBody): Promise<LoginResult> {
    if (dto.pendingToken && dto.code) {
      const authResponse = await AuthService.verifyTwoFactorLoginToken(dto.pendingToken, dto.code)
      return { requiresTwoFactor: false, ...authResponse }
    }
    return AuthService.loginWithPassword(dto)
  }

  private static async loginWithPassword(dto: { email: string; password: string }): Promise<LoginResult> {
    const existingUser = await AuthRepository.findByEmailWithPassword(dto.email)
    if (!existingUser || !existingUser.password) {
      throw new UnauthorizedError('User or password is invalid')
    }

    const isPasswordValid = await comparePassword(dto.password, existingUser.password)
    if (!isPasswordValid) {
      throw new UnauthorizedError('User or password is invalid')
    }

    if (existingUser.isTwoFactorEnabled) {
      const pendingToken = AuthCacheService.generatePendingLoginToken(existingUser.id)
      return { requiresTwoFactor: true, pendingToken }
    }

    const { accessToken, refreshToken } = await AuthService.generateTokens(existingUser)
    const user = instanceToPlain(existingUser) as AuthUser
    return { requiresTwoFactor: false, accessToken, refreshToken, user }
  }

  private static async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = JWTService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = JWTService.generateRefreshToken({
      sub: user.id
    })
    const refreshTokenHash = JWTService.hashRefreshToken(refreshToken)

    await Promise.all([
      AuthRepository.saveRefreshToken({
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + Number(env.JWT_REFRESH_EXPIRES_IN) * 1000),
        absoluteExpiresAt: new Date(Date.now() + Number(env.MAX_SESSION_LIFETIME_IN) * 1000)
      }),
      AuthRepository.updateLastLogin(user.id)
    ])
    return { accessToken, refreshToken }
  }
}

export default AuthService
