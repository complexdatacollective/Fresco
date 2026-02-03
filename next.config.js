// @ts-check

import('./env.js');
import ChildProcess from 'node:child_process';
import { createRequire } from 'node:module';
import withSerwistInit from '@serwist/next';
import pkg from './package.json' with { type: 'json' };

const withSerwist = withSerwistInit({
  swSrc: 'lib/pwa/sw.ts',
  swDest: 'public/sw.js',
  // Enable in production, or in development when ENABLE_SW=true
  // eslint-disable-next-line no-process-env
  disable: process.env.NODE_ENV !== 'production' && process.env.ENABLE_SW !== 'true',
});

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
  experimental: {
    typedRoutes: true,
    webpackBuildWorker: true,
  },
  sassOptions: {
    implementation: 'sass-embedded',
  },
  images: {
    // Disable image optimization when DISABLE_IMAGE_OPTIMIZATION is set.
    // This is useful for Docker test environments where Sharp may have issues.
    // eslint-disable-next-line no-process-env
    unoptimized: process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
  },
  transpilePackages: ['@codaco/shared-consts'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(jpe?g|png|svg|gif|ico|eot|ttf|woff|woff2|mp4|pdf|webm|txt|mp3)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]',
      },
    });

    return config;
  },
  env: {
    // add the package.json version and git hash to the environment
    APP_VERSION: `v${pkg.version}`,
    COMMIT_HASH: commitHash,
  },
  eslint: {
    dirs: ['./'],
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default withSerwist(config);
