import path from 'node:path'

import { defineConfig } from 'vitest/config'

const src = (p: string) => path.resolve(__dirname, 'src', p)

export default defineConfig({
  resolve: {
    alias: {
      '@common': src('common'),
      '@modules': src('modules'),
      '@entities': src('databases/entities'),
      '@databases': src('databases'),
      '@docs': src('docs')
    }
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Dummy values, only for unit tests.
    env: {
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:3000',
      CLIENT_ORIGINS: 'http://localhost:3000',
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
      JWT_SECRET: 'x'.repeat(32),
      JWT_REFRESH_SECRET: 'y'.repeat(32),
      REFRESH_TOKEN_HASH_SECRET: 'z'.repeat(32),
      AUTH_TOKEN_HASH_SECRET: 'w'.repeat(32)
    }
  }
})
