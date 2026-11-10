import { z } from 'zod/v4'

const serverEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.url(),
  CLIENT_ORIGINS: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    )
    .refine(
      (urls) => urls.length > 0 && urls.every((url) => z.url().safeParse(url).success),
      'Each CLIENT_ORIGINS must be a valid URL'
    ),
  // Number of reverse proxies in front of the API (0 in dev, 1 behind nginx).
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Refresh-token cookie `Secure` flag. Defaults to true in production; set false only for plain-HTTP testing.
  COOKIE_SECURE: z.stringbool().optional(),
  ENABLE_DOCS: z.stringbool().default(true)
})

const databaseEnvSchema = z.object({
  DATABASE_URL: z.url(),
  // Enable TLS to PostgreSQL (managed databases). Leave false for the bundled docker compose database.
  DATABASE_SSL: z.stringbool().default(false),
  // Run pending migrations on API start-up (used by docker compose).
  AUTO_MIGRATE: z.stringbool().default(false)
})

const securityEnvSchema = z.object({
  // base64 of exactly 32 random bytes:  openssl rand -base64 32
  ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'ENCRYPTION_KEY must be base64 of exactly 32 bytes')
})

const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REFRESH_TOKEN_HASH_SECRET: z.string().min(32),
  AUTH_TOKEN_HASH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  JWT_REFRESH_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60),
  MAX_SESSION_LIFETIME_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 24 * 60 * 60)
})

// Google sign-in is optional: leave empty to disable.
const googleEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.url().default('http://localhost:8080/api/v1/auth/google/callback')
})

const emailEnvSchema = z.object({
  EMAIL_PROVIDER: z.enum(['nodemailer', 'resend']).default('nodemailer'),
  MAIL_FROM: z.email().default('noreply@example.com'),
  MAIL_FROM_NAME: z.string().default(''),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  RESEND_API_KEY: z.string().default('')
})

const appEnvSchema = z.object({
  APP_NAME: z.string().min(1).default('ShellDeck'),
  VERIFY_EMAIL_EXPIRE_MINUTES: z.coerce.number().int().positive().default(10),
  RESET_PASSWORD_EXPIRE_MINUTES: z.coerce.number().int().positive().default(5)
})

const terminalEnvSchema = z.object({
  MAX_SESSIONS_PER_USER: z.coerce.number().int().positive().default(5),
  SESSION_IDLE_TIMEOUT_MIN: z.coerce.number().int().positive().default(30)
})

const envSchema = z.object({
  ...serverEnvSchema.shape,
  ...databaseEnvSchema.shape,
  ...securityEnvSchema.shape,
  ...authEnvSchema.shape,
  ...googleEnvSchema.shape,
  ...emailEnvSchema.shape,
  ...appEnvSchema.shape,
  ...terminalEnvSchema.shape
})

type ParsedEnv = z.infer<typeof envSchema>
export type EnvSchema = Omit<ParsedEnv, 'COOKIE_SECURE'> & { COOKIE_SECURE: boolean }

const validateEnv = (): EnvSchema => {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('Invalid environment variables:')
    console.error(z.prettifyError(result.error))
    process.exit(1)
  }

  return { ...result.data, COOKIE_SECURE: result.data.COOKIE_SECURE ?? result.data.NODE_ENV === 'production' }
}

const env: EnvSchema = validateEnv()

export default env
