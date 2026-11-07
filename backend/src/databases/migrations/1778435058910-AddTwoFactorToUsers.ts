import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTwoFactorToUsers1778435058910 implements MigrationInterface {
  name = 'AddTwoFactorToUsers1778435058910'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "is_two_factor_enabled" boolean NOT NULL DEFAULT false`)
    await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_secret" character varying(255)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_secret"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_two_factor_enabled"`)
  }
}
