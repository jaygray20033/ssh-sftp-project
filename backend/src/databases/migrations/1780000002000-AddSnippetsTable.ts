import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSnippetsTable1780000002000 implements MigrationInterface {
  name = 'AddSnippetsTable1780000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "snippets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "command" text NOT NULL, "description" character varying(1000), "user_id" uuid NOT NULL, CONSTRAINT "UQ_snippets_user_name" UNIQUE ("user_id", "name"), CONSTRAINT "PK_snippets_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_snippets_user_id" ON "snippets" ("user_id")`)
    await queryRunner.query(
      `ALTER TABLE "snippets" ADD CONSTRAINT "FK_snippets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "snippets" DROP CONSTRAINT "FK_snippets_user_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_snippets_user_id"`)
    await queryRunner.query(`DROP TABLE "snippets"`)
  }
}
