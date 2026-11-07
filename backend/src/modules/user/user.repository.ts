import { User } from '@entities/user.entity'

import AppDataSource from '@databases/data-source'

class UserRepository {
  static getUserById(id: string) {
    return this.userRepo.findOne({ where: { id } })
  }

  static getUserByUsername(username: string) {
    return this.userRepo.findOne({ where: { username } })
  }

  static updateUser(id: string, updateData: Partial<Pick<User, 'username' | 'fullName' | 'avatarUrl'>>) {
    return this.userRepo.update({ id }, updateData)
  }

  static getUserWithPassword(id: string) {
    return this.userRepo.createQueryBuilder('user').addSelect('user.password').where('user.id = :id', { id }).getOne()
  }

  static updateUserPassword(id: string, newPassword: string) {
    return this.userRepo.update({ id }, { password: newPassword })
  }

  static softDeleteUser(id: string) {
    return this.userRepo.softDelete({ id })
  }

  private static get userRepo() {
    return AppDataSource.getDataSource().getRepository(User)
  }
}

export default UserRepository
