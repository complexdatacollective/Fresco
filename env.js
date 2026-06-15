/* eslint-disable no-process-env */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Blank values (e.g. `UPLOADTHING_TOKEN=` left in .env) must behave as unset,
// otherwise they override database-stored storage settings with '' and flip
// env-managed detection.
const emptyToUndefined = (value) => (value === '' ? undefined : value);

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL_UNPOOLED: z.string(),
    DATABASE_URL: z.string(),
    PUBLIC_URL: z.string().url().optional(),
    USE_NEON_POSTGRES_ADAPTER: z.stringbool().optional(),
    STORAGE_PROVIDER: z.preprocess(
      emptyToUndefined,
      z.enum(['s3', 'uploadthing']).optional(),
    ),
    S3_ENDPOINT: z.preprocess(emptyToUndefined, z.string().url().optional()),
    S3_PUBLIC_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    S3_BUCKET: z.preprocess(emptyToUndefined, z.string().optional()),
    S3_REGION: z.preprocess(emptyToUndefined, z.string().optional()),
    S3_ACCESS_KEY_ID: z.preprocess(emptyToUndefined, z.string().optional()),
    S3_SECRET_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
    UPLOADTHING_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {},
  shared: {
    PUBLIC_URL: z.string().url().optional(),
    INSTALLATION_ID: z.string().optional(),
    DISABLE_ANALYTICS: z.stringbool().optional(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    CI: z.stringbool().optional(),
    SANDBOX_MODE: z.stringbool().optional(),
    COOKIE_SECURE: z.stringbool().optional(),
    APP_VERSION: z.string().optional(),
    COMMIT_HASH: z.string().optional(),
  },
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    NODE_ENV: process.env.NODE_ENV,
    CI: process.env.CI,
    PUBLIC_URL: process.env.PUBLIC_URL,
    DISABLE_ANALYTICS: process.env.DISABLE_ANALYTICS,
    INSTALLATION_ID: process.env.INSTALLATION_ID,
    SANDBOX_MODE: process.env.SANDBOX_MODE,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    APP_VERSION: process.env.APP_VERSION,
    COMMIT_HASH: process.env.COMMIT_HASH,
    USE_NEON_POSTGRES_ADAPTER: process.env.USE_NEON_POSTGRES_ADAPTER,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
