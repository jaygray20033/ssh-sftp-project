import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexesToUsers1776830920713 implements MigrationInterface {
  name = 'AddIndexesToUsers1776830920713'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role") `)
    await queryRunner.query(`CREATE INDEX "IDX_users_google_id" ON "users" ("google_id") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_google_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`)
  }
}
