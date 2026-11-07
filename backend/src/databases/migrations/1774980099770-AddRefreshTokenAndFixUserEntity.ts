import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRefreshTokenAndFixUserEntity1774980099770 implements MigrationInterface {
  name = 'AddRefreshTokenAndFixUserEntity1774980099770'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "token" text NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "absolute_expires_at" TIMESTAMP NOT NULL,
        CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"),
        CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$
    `)

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_user_id"
      ON "refresh_tokens" ("user_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id"`)
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`)
    await queryRunner.query(`DROP TABLE "refresh_tokens"`)
  }
}
