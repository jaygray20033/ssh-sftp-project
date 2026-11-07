import { Request, Response } from 'express'

import { UpdateUserBody, UpdateUserPasswordBody } from './dto'
import UserService from './user.service'

class UserController {
  static async getUserInfo(req: Request, res: Response) {
    const userId = req.user!.id
    const user = await UserService.getUserInfo(userId)
    return res.ok(user)
  }

  static async updateUserInfo(req: Request, res: Response) {
    const userId = req.user!.id
    const updateData = req.body as UpdateUserBody
    const updatedUser = await UserService.updateUserInfo(userId, updateData)
    return res.ok(updatedUser, { message: 'User updated successfully' })
  }

  static async updateUserPassword(req: Request, res: Response) {
    const userId = req.user!.id
    const dto = req.body as UpdateUserPasswordBody
    await UserService.updateUserPassword(userId, dto)
    return res.ok(null, { message: 'Password updated successfully' })
  }

  static async deleteUser(req: Request, res: Response) {
    await UserService.deleteUser(req.user!.id)
    return res.status(204).send()
  }
}

export default UserController
