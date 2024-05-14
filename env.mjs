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
    DATABASE_URL: z.string().optional(),
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
    NEXT_PUBLIC_DISABLE_ANALYTICS: strictBooleanSchema,
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
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_DISABLE_ANALYTICS: process.env.NEXT_PUBLIC_DISABLE_ANALYTICS,
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
