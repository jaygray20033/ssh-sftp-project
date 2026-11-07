import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'

import { BaseEntity } from './base.entity'
import { User } from './user.entity'

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ unique: true, type: 'text' })
  token: string

  @Index('IDX_refresh_tokens_user_id')
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ type: 'timestamp' })
  absoluteExpiresAt: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
