import { MigrationInterface, QueryRunner } from 'typeorm'

export class EnableUuidExtension1774949642200 implements MigrationInterface {
  name = 'EnableUuidExtension1774949642200'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
  }

  public async down(): Promise<void> {
    // Intentionally left empty: other objects may depend on the extension.
  }
}
