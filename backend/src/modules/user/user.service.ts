import bcrypt from 'bcrypt'
import { instanceToPlain } from 'class-transformer'

import { SALT_ROUNDS } from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { comparePassword } from '@common/utils/password'

import AuthRepository from '@modules/auth/auth.repository'

import { UpdateUserBody, UpdateUserPasswordBody } from './dto'
import UserRepository from './user.repository'

class UserService {
  static async getUserInfo(id: string) {
    const user = await UserRepository.getUserById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const plainUser = instanceToPlain(user)

    return plainUser
  }

  static async updateUserInfo(id: string, dto: UpdateUserBody) {
    const user = await UserRepository.getUserById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const userWithSameUsername = dto.username && (await UserRepository.getUserByUsername(dto.username))
    if (userWithSameUsername && userWithSameUsername.id !== id) {
      throw new ConflictError('Username already taken')
    }

    await UserRepository.updateUser(id, dto)

    const updatedUser = await UserRepository.getUserById(id)
    if (!updatedUser) {
      throw new NotFoundError('User not found')
    }

    const plainUpdatedUser = instanceToPlain(updatedUser)
    return plainUpdatedUser
  }
  static async updateUserPassword(id: string, dto: UpdateUserPasswordBody) {
    const user = await UserRepository.getUserWithPassword(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (!user.password) {
      throw new BadRequestError('Account does not have a password set')
    }

    const isCurrentPasswordValid = await comparePassword(dto.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new BadRequestError('Current password is incorrect')
    }
    const newPasswordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS)
    await UserRepository.updateUserPassword(id, newPasswordHash)
    await AuthRepository.deleteAllRefreshTokensByUserId(id)
  }

  static async deleteUser(id: string) {
    const result = await UserRepository.softDeleteUser(id)
    if (!result.affected) {
      throw new NotFoundError('User not found')
    }
  }
}

export default UserService
