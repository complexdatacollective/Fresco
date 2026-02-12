// @ts-check

import('./env.js');
import ChildProcess from 'node:child_process';
import { createRequire } from 'node:module';
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

/** @type {import("next").NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  // Use no-op cache handler for E2E tests, otherwise use Next.js default
  // See lib/cache-handler.cjs and lib/cache.ts for caching strategy docs
  cacheHandler: disableNextCache
    ? require.resolve('./lib/cache-handler.cjs')
    : undefined,
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
export default config;
