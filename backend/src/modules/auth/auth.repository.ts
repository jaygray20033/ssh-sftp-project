import { IsNull, MoreThan } from 'typeorm'

import { AuthTokenType } from '@common/constants'

import { AuthToken } from '@entities/auth-token.entity'
import { RefreshToken } from '@entities/refresh-token.entity'
import { User } from '@entities/user.entity'

import AppDataSource from '@databases/data-source'

import { RegisterBody } from './dto'

class AuthRepository {
  static createUser(user: Omit<RegisterBody, 'confirmPassword'>) {
    const newUser = this.userRepo.create(user)
    return this.userRepo.save(newUser)
  }

  static createUserWithVerifyToken(
    userData: Omit<RegisterBody, 'confirmPassword'> & { password: string },
    tokenData: { tokenHash: string; expiresAt: Date; type: AuthTokenType }
  ) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      const userRepo = manager.getRepository(User)
      const authTokenRepo = manager.getRepository(AuthToken)

      const created = userRepo.create(userData)
      const savedUser = await userRepo.save(created)

      const tokenEntity = authTokenRepo.create({
        token: tokenData.tokenHash,
        userId: savedUser.id,
        type: tokenData.type,
        expiresAt: tokenData.expiresAt
      })
      await authTokenRepo.save(tokenEntity)

      return savedUser
    })
  }

  static createOAuthUser(data: { email: string; fullName: string; googleId: string; avatarUrl?: string | null }) {
    const newUser = this.userRepo.create({ ...data, isEmailVerified: true })
    return this.userRepo.save(newUser)
  }

  static findByUsername(username: string) {
    return this.userRepo.findOne({ where: { username } })
  }

  static findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } })
  }

  static findByEmailWithPassword(email: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne()
  }

  static findById(id: string) {
    return this.userRepo.findOne({ where: { id } })
  }

  static updateLastLogin(id: string) {
    return this.userRepo.update(id, { lastLoginAt: new Date() })
  }

  static saveRefreshToken(data: { tokenHash: string; userId: string; expiresAt: Date; absoluteExpiresAt: Date }) {
    const newRefreshToken = this.refreshTokenRepo.create({
      token: data.tokenHash,
      userId: data.userId,
      expiresAt: data.expiresAt,
      absoluteExpiresAt: data.absoluteExpiresAt
    })
    return this.refreshTokenRepo.save(newRefreshToken)
  }

  static findRefreshToken(tokenHash: string) {
    return this.refreshTokenRepo.findOne({ where: { token: tokenHash } })
  }

  static deleteRefreshToken(tokenHash: string) {
    return this.refreshTokenRepo.delete({ token: tokenHash })
  }

  static deleteRefreshTokenById(id: string) {
    return this.refreshTokenRepo.delete({ id })
  }

  static updateGoogleProfile(id: string, data: { avatarUrl?: string }) {
    return this.userRepo.update(id, data)
  }

  static findAuthToken(tokenHash: string, type: AuthTokenType) {
    return this.authTokenRepo.findOne({
      where: { token: tokenHash, type, usedAt: IsNull(), expiresAt: MoreThan(new Date()) }
    })
  }

  static markEmailVerified(userId: string) {
    return this.userRepo.update(userId, { isEmailVerified: true })
  }

  static markAuthTokenUsed(id: string) {
    return this.authTokenRepo.update(id, { usedAt: new Date() })
  }

  static deleteUserAuthTokensByType(userId: string, type: AuthTokenType) {
    return this.authTokenRepo.delete({ userId, type })
  }

  static createAuthToken(data: { tokenHash: string; userId: string; type: AuthTokenType; expiresAt: Date }) {
    const token = this.authTokenRepo.create({
      token: data.tokenHash,
      userId: data.userId,
      type: data.type,
      expiresAt: data.expiresAt
    })
    return this.authTokenRepo.save(token)
  }

  static updatePassword(userId: string, hashedPassword: string) {
    return this.userRepo.update(userId, { password: hashedPassword })
  }

  static findByIdWithTwoFactorSecret(id: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id })
      .getOne()
  }

  static saveTwoFactorSecretAndEnable(id: string, secret: string) {
    return this.userRepo.update(id, { twoFactorSecret: secret, isTwoFactorEnabled: true })
  }

  static disableTwoFactor(id: string) {
    return this.userRepo.update(id, { isTwoFactorEnabled: false, twoFactorSecret: null })
  }

  static deleteAllRefreshTokensByUserId(userId: string) {
    return this.refreshTokenRepo.delete({ userId })
  }

  private static get userRepo() {
    return AppDataSource.getDataSource().getRepository(User)
  }

  private static get refreshTokenRepo() {
    return AppDataSource.getDataSource().getRepository(RefreshToken)
  }

  private static get authTokenRepo() {
    return AppDataSource.getDataSource().getRepository(AuthToken)
  }
}

export default AuthRepository
