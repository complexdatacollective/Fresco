/* eslint-disable no-process-env */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // Vercel Postgres env vars
    POSTGRES_URL: z.string().url().optional(),
    POSTGRES_PRISMA_URL: z.string().url().optional(),
    POSTGRES_URL_NO_SSL: z.string().url().optional(),
    POSTGRES_URL_NON_POOLING: z.string().url().optional(),
    POSTGRES_USER: z.string().optional(),
    POSTGRES_HOST: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_DATABASE: z.string().optional(),

    INSTALLATION_ID: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {},
  shared: {
    NEXT_PUBLIC_URL: z.string().url().optional(),
    VERCEL_URL: z.string().optional(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    // this is a workaround for this issue:https://github.com/colinhacks/zod/issues/1630
    // z.coerce.boolean() doesn't work as expected
    DISABLE_ANALYTICS: z
      .enum(['true', 'false', 'True', 'False', 'TRUE', 'FALSE'])
      .default('false')
      .transform(
        (value) => value === 'true' || value === 'True' || value === 'TRUE',
      ),
    SANDBOX_MODE: z
      .enum(['true', 'false', 'True', 'False', 'TRUE', 'FALSE'])
      .default('false')
      .transform(
        (value) => value === 'true' || value === 'True' || value === 'TRUE',
      ),
    APP_VERSION: z.string().optional(),
    COMMIT_HASH: z.string().optional(),
  },
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    DISABLE_ANALYTICS: process.env.DISABLE_ANALYTICS,
    SANDBOX_MODE: process.env.SANDBOX_MODE,
    INSTALLATION_ID: process.env.INSTALLATION_ID,
    APP_VERSION: process.env.APP_VERSION,
    COMMIT_HASH: process.env.COMMIT_HASH,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
