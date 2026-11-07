import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'

import { AUTH_TOKEN, AuthTokenType } from '@common/constants/auth.constant'

import { BaseEntity } from '@entities/base.entity'

import { User } from './user.entity'

@Entity('auth_tokens')
export class AuthToken extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token: string

  @Column({
    type: 'enum',
    enum: AUTH_TOKEN
  })
  type: AuthTokenType

  @Index('IDX_auth_tokens_user_id')
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date | null

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
