/* eslint-disable no-process-env */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string(),
    DATABASE_URL_UNPOOLED: z.string(),
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
     * DISABLE_NEXT_CACHE Environment Variable
     *
     * When set to 'true', completely disables Next.js caching for test isolation.
     * This variable controls two caching layers:
     *
     * 1. File-based Data Cache (next.config.js + lib/cache-handler.cjs)
     *    - Build time: Includes no-op cache handler in standalone build
     *    - Runtime: Handler returns cache misses for all operations
     *
     * 2. In-memory request deduplication (this file)
     *    - Runtime: Bypasses unstable_cache entirely
     *    - Returns unwrapped functions that hit the database directly
     *
     * Usage:
     * - E2E tests: Set at build time (tests/e2e/global-setup.ts) AND runtime
     * - Production: Not set - uses Next.js default caching
     */
    DISABLE_NEXT_CACHE: z.stringbool().optional(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    CI: z.stringbool().optional(),
    SANDBOX_MODE: z.stringbool().optional(),
    PREVIEW_MODE: z.stringbool().optional(),
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
    DISABLE_NEXT_CACHE: process.env.DISABLE_NEXT_CACHE,
    INSTALLATION_ID: process.env.INSTALLATION_ID,
    SANDBOX_MODE: process.env.SANDBOX_MODE,
    PREVIEW_MODE: process.env.PREVIEW_MODE,
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
