import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'

import { BaseEntity } from './base.entity'
import { Host } from './host.entity'
import { User } from './user.entity'

@Entity('session_logs')
@Index('IDX_session_logs_user_id', ['userId'])
@Index('IDX_session_logs_started_at', ['startedAt'])
export class SessionLog extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'uuid' })
  userId: string

  // null when the host was deleted (ON DELETE SET NULL).
  @ManyToOne(() => Host, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'host_id' })
  host: Host | null

  @Column({ type: 'uuid', nullable: true })
  hostId: string | null

  // Host name at connect time, so logs survive host renames/deletes.
  @Column({ type: 'varchar', length: 100 })
  hostLabel: string

  @Column({ type: 'timestamp' })
  startedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null

  @Column({ type: 'varchar', length: 45 })
  clientIp: string

  // Keystrokes and output are never logged, only why the session ended.
  @Column({ type: 'varchar', length: 100, nullable: true })
  closeReason: string | null
}
