/* eslint-disable no-process-env */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
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
    MAXMIND_ACCOUNT_ID: z.string(),
    MAXMIND_LICENSE_KEY: z.string(),
    NEXT_PUBLIC_ANALYTICS_ENABLED: z.string().optional(),
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
    MAXMIND_ACCOUNT_ID: process.env.MAXMIND_ACCOUNT_ID,
    MAXMIND_LICENSE_KEY: process.env.MAXMIND_LICENSE_KEY,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  // skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  skipValidation: true,
});
