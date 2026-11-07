import { Exclude } from 'class-transformer'
import { Entity, Column, Index } from 'typeorm'

import { USER_ROLE, UserRole } from '@common/constants'

import { BaseEntity } from './base.entity'

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', unique: true, length: 30, nullable: true })
  username?: string | null

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', select: false, length: 72, nullable: true })
  password?: string | null

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ length: 255 })
  fullName: string

  @Index('IDX_users_role')
  @Column({ type: 'enum', enum: USER_ROLE, default: USER_ROLE.USER })
  role: UserRole

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null

  @Index('IDX_users_google_id')
  @Column({ type: 'varchar', nullable: true, length: 255 })
  googleId?: string

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean

  @Column({ type: 'boolean', default: false })
  isTwoFactorEnabled: boolean

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  twoFactorSecret?: string | null
}
