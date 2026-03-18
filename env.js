/* eslint-disable no-process-env */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

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
    /**
     * E2E_TEST Environment Variable
     *
     * General flag for e2e test environments. When set to 'true':
     * - Disables Next.js caching via the no-op cacheHandlers in next.config.ts
     * - Enables local file storage for exports instead of UploadThing
     *
     * Usage:
     * - E2E tests: Set at build time AND runtime
     * - Production: Not set
     */
    E2E_TEST: z.stringbool().optional(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    CI: z.stringbool().optional(),
    SANDBOX_MODE: z.stringbool().optional(),
    PREVIEW_MODE: z.stringbool().optional(),
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
    E2E_TEST: process.env.E2E_TEST,
    INSTALLATION_ID: process.env.INSTALLATION_ID,
    SANDBOX_MODE: process.env.SANDBOX_MODE,
    PREVIEW_MODE: process.env.PREVIEW_MODE,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    APP_VERSION: process.env.APP_VERSION,
    COMMIT_HASH: process.env.COMMIT_HASH,
    USE_NEON_POSTGRES_ADAPTER: process.env.USE_NEON_POSTGRES_ADAPTER,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
