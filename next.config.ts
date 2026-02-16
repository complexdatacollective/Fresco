import { withPostHogConfig } from '@posthog/nextjs-config';
import type { NextConfig } from 'next';
import ChildProcess from 'node:child_process';
import { createRequire } from 'node:module';
import './env.js';
import { POSTHOG_APP_NAME, POSTHOG_PROXY_HOST } from './fresco.config.js';
import pkg from './package.json' with { type: 'json' };

const require = createRequire(import.meta.url);

let commitHash = 'Unknown commit hash';

try {
  commitHash = ChildProcess.execSync('git log --pretty=format:"%h" -n1')
    .toString()
    .trim();
} catch (error) {
  if (error instanceof Error) {
    // eslint-disable-next-line no-console
    console.info(
      'Error getting commit hash:',
      error.message ?? 'Unknown error',
    );
  } else {
    // eslint-disable-next-line no-console
    console.info('Error getting commit hash:', error);
  }
}

// eslint-disable-next-line no-process-env
const disableNextCache = process.env.DISABLE_NEXT_CACHE === 'true';

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  reactCompiler: true,
  // Use no-op cache handler for E2E tests, otherwise use Next.js default.
  // cacheHandlers (plural) intercepts 'use cache' directives.
  // See lib/cache-handler.cjs and lib/cache.ts for caching strategy docs.
  cacheHandlers: disableNextCache
    ? { default: require.resolve('./lib/cache-handler.cjs') }
    : undefined,
  cacheComponents: true,
  typedRoutes: true,
  turbopack: {},
  transpilePackages: ['@codaco/shared-consts'],
  env: {
    // add the package.json version and git hash to the environment
    APP_VERSION: `v${pkg.version}`,
    COMMIT_HASH: commitHash,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPostHogConfig(config, {
  // eslint-disable-next-line no-process-env
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY!,
  // eslint-disable-next-line no-process-env
  projectId: process.env.POSTHOG_PROJECT_ID,
  host: POSTHOG_PROXY_HOST,
  sourcemaps: {
    releaseName: POSTHOG_APP_NAME, // (optional) Release name, defaults to repository name
    deleteAfterUpload: true, // (optional) Delete sourcemaps after upload, defaults to true
  },
});
