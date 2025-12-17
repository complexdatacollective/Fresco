/* eslint-disable no-process-env */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// this is a workaround for this issue:https://github.com/colinhacks/zod/issues/1630
// z.coerce.boolean() doesn't work as expected
const strictBooleanSchema = z
  .enum(['true', 'false', 'True', 'False', 'TRUE', 'FALSE'])
  .default('false')
  .transform(
    (value) => value === 'true' || value === 'True' || value === 'TRUE',
  );

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string(),
    DATABASE_URL_UNPOOLED: z.string(),
    PUBLIC_URL: z.string().url().optional(),
    USE_NEON_POSTGRES_ADAPTER: strictBooleanSchema,
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
    DISABLE_ANALYTICS: strictBooleanSchema,
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    SANDBOX_MODE: strictBooleanSchema,
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
    PUBLIC_URL: process.env.PUBLIC_URL,
    DISABLE_ANALYTICS: process.env.DISABLE_ANALYTICS,
    INSTALLATION_ID: process.env.INSTALLATION_ID,
    SANDBOX_MODE: process.env.SANDBOX_MODE,
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
