import type { NextConfig } from 'next';
import ChildProcess from 'node:child_process';
import { createRequire } from 'node:module';
import { withPostHogConfig } from '@posthog/nextjs-config';
import './env.js';
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
  rewrites: () => [
    {
      source: '/ingest/static/:path*',
      destination: 'https://ph-proxy.networkcanvas.com/static/:path*',
    },
    {
      source: '/ingest/decide',
      destination: 'https://ph-proxy.networkcanvas.com/decide',
    },
    {
      source: '/ingest/:path*',
      destination: 'https://ph-proxy.networkcanvas.com/:path*',
    },
  ],
  skipTrailingSlashRedirect: true,
};

// eslint-disable-next-line no-process-env
const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

export default posthogPersonalApiKey
  ? withPostHogConfig(config, {
      personalApiKey: posthogPersonalApiKey,
      host: 'https://us.posthog.com',
      sourcemaps: {
        enabled: true,
        releaseName: 'fresco',
        releaseVersion: `v${pkg.version}`,
        deleteAfterUpload: true,
      },
    })
  : config;
