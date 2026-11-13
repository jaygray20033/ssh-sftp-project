import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm'

import { AuthType } from '@common/constants/host.constant'

import { BaseEntity } from './base.entity'
import { User } from './user.entity'

@Entity('hosts')
@Unique('UQ_hosts_user_name', ['userId', 'name'])
@Index('IDX_hosts_user_id', ['userId'])
export class Host extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'varchar', length: 255 })
  hostname: string

  @Column({ type: 'int', default: 22 })
  port: number

  @Column({ type: 'varchar', length: 100 })
  username: string

  @Column({ type: 'enum', enum: AuthType })
  authType: AuthType

  // AES-256-GCM payload (see CryptoService). Never serialize this column to API responses.
  @Column({ type: 'text' })
  encryptedSecret: string

  @Column({ type: 'text', nullable: true })
  encryptedPassphrase: string | null

  // `SHA256:<base64>` of the server host key, set after the user trusts it.
  @Column({ type: 'varchar', length: 100, nullable: true })
  hostKeyFingerprint: string | null

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null

  @Column({ type: 'timestamp', nullable: true })
  lastConnectedAt: Date | null

  // Opt-in asciicast recording (B11). Recorded output may contain typed passwords.
  @Column({ type: 'boolean', default: false })
  recordSessions: boolean

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'uuid' })
  userId: string
}
