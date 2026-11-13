import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRecordSessionsToHosts1780000003000 implements MigrationInterface {
  name = 'AddRecordSessionsToHosts1780000003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Opt-in per host; recorded output may contain typed passwords (see docs/security.md).
    await queryRunner.query(`ALTER TABLE "hosts" ADD "record_sessions" boolean NOT NULL DEFAULT false`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hosts" DROP COLUMN "record_sessions"`)
  }
}
