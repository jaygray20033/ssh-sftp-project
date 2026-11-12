import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSessionLogsTable1780000001000 implements MigrationInterface {
  name = 'AddSessionLogsTable1780000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "session_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "host_label" character varying(100) NOT NULL, "started_at" TIMESTAMP NOT NULL, "ended_at" TIMESTAMP, "client_ip" character varying(45) NOT NULL, "close_reason" character varying(100), "user_id" uuid NOT NULL, "host_id" uuid, CONSTRAINT "PK_session_logs_id" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_session_logs_user_id" ON "session_logs" ("user_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_session_logs_started_at" ON "session_logs" ("started_at")`)
    await queryRunner.query(
      `ALTER TABLE "session_logs" ADD CONSTRAINT "FK_session_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "session_logs" ADD CONSTRAINT "FK_session_logs_host_id" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "session_logs" DROP CONSTRAINT "FK_session_logs_host_id"`)
    await queryRunner.query(`ALTER TABLE "session_logs" DROP CONSTRAINT "FK_session_logs_user_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_session_logs_started_at"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_session_logs_user_id"`)
    await queryRunner.query(`DROP TABLE "session_logs"`)
  }
}
