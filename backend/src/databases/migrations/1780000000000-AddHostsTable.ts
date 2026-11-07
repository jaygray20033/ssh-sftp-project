import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddHostsTable1780000000000 implements MigrationInterface {
  name = 'AddHostsTable1780000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."hosts_auth_type_enum" AS ENUM('password', 'private_key')`)
    await queryRunner.query(
      `CREATE TABLE "hosts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "hostname" character varying(255) NOT NULL, "port" integer NOT NULL DEFAULT '22', "username" character varying(100) NOT NULL, "auth_type" "public"."hosts_auth_type_enum" NOT NULL, "encrypted_secret" text NOT NULL, "encrypted_passphrase" text, "host_key_fingerprint" character varying(100), "tags" text, "last_connected_at" TIMESTAMP, "user_id" uuid NOT NULL, CONSTRAINT "UQ_hosts_user_name" UNIQUE ("user_id", "name"), CONSTRAINT "PK_c4bcf0826e0e2847faee4da1746" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_hosts_user_id" ON "hosts" ("user_id")`)
    await queryRunner.query(
      `ALTER TABLE "hosts" ADD CONSTRAINT "FK_bf0c777c0a861de90407b0c586e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hosts" DROP CONSTRAINT "FK_bf0c777c0a861de90407b0c586e"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_hosts_user_id"`)
    await queryRunner.query(`DROP TABLE "hosts"`)
    await queryRunner.query(`DROP TYPE "public"."hosts_auth_type_enum"`)
  }
}
