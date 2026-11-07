import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGoogleOAuthToUsers1776656120793 implements MigrationInterface {
  name = 'AddGoogleOAuthToUsers1776656120793'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_user_id"`)
    await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying(255)`)
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`)
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`)
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`)
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id") `)
  }
}
