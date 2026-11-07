import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuthTokenAndAddVerifyEmailToUsers1778059148834 implements MigrationInterface {
  name = 'AddAuthTokenAndAddVerifyEmailToUsers1778059148834'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('VERIFY_EMAIL', 'RESET_PASSWORD')`)
    await queryRunner.query(
      `CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "token" character varying(64) NOT NULL, "type" "public"."auth_tokens_type_enum" NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0db4d75e7b32888464cdf8e374" ON "auth_tokens" ("token") `)
    await queryRunner.query(`CREATE INDEX "IDX_auth_tokens_user_id" ON "auth_tokens" ("user_id") `)
    await queryRunner.query(`ALTER TABLE "users" ADD "is_email_verified" boolean NOT NULL DEFAULT false`)
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_verified"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_auth_tokens_user_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_0db4d75e7b32888464cdf8e374"`)
    await queryRunner.query(`DROP TABLE "auth_tokens"`)
    await queryRunner.query(`DROP TYPE "public"."auth_tokens_type_enum"`)
  }
}
