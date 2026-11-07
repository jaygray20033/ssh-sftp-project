import { Exclude } from 'class-transformer'
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Exclude({ toPlainOnly: true })
  @CreateDateColumn()
  createdAt: Date

  @Exclude({ toPlainOnly: true })
  @UpdateDateColumn()
  updatedAt: Date

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn()
  deletedAt: Date | null
}
