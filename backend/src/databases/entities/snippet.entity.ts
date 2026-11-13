import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm'

import { BaseEntity } from './base.entity'
import { User } from './user.entity'

@Entity('snippets')
@Unique('UQ_snippets_user_name', ['userId', 'name'])
@Index('IDX_snippets_user_id', ['userId'])
export class Snippet extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string

  // Stored as plain text, max 4KB. Only the frontend "types" it into a terminal.
  @Column({ type: 'text' })
  command: string

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'uuid' })
  userId: string
}
