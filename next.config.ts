import { withPostHogConfig } from '@posthog/nextjs-config';
import type { NextConfig } from 'next';
import ChildProcess from 'node:child_process';
import './env.js';
import { POSTHOG_APP_NAME } from './fresco.config';
import pkg from './package.json' with { type: 'json' };

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

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  reactCompiler: true,
  cacheComponents: true,
  typedRoutes: true,
  turbopack: {},
  transpilePackages: ['@codaco/shared-consts'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'es-toolkit'],
  },
  serverExternalPackages: [
    'posthog-node',
    'archiver',
    '@xmldom/xmldom',
    'csvtojson',
    'sharp',
  ],
  env: {
    APP_VERSION: `v${pkg.version}`,
    COMMIT_HASH: commitHash,
  },
  headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains',
      },
    ];

    // Interview/onboard URLs carry the interview id, which is the
    // unauthenticated participant access capability. Send no Referer from these
    // routes so the id can never leak to third-party sub-resources.
    const noReferrer = [{ key: 'Referrer-Policy', value: 'no-referrer' }];

    return Promise.resolve([
      { source: '/:path*', headers: securityHeaders },
      { source: '/interview/:path*', headers: noReferrer },
      { source: '/onboard/:path*', headers: noReferrer },
    ]);
  },
};

// eslint-disable-next-line no-process-env
const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
// eslint-disable-next-line no-process-env
const posthogProjectId = process.env.POSTHOG_PROJECT_ID;

/**
 * posthog requires personalApiKey and projectId to be set at build time, but
 * we don't want to require them for local development or CI. If they're not
 * set, we provide dummy values and the posthog client will be a no-op.
 */
export default withPostHogConfig(config, {
  personalApiKey: posthogPersonalApiKey ?? 'none',
  projectId: posthogProjectId ?? 'none',
  sourcemaps: {
    enabled:
      // eslint-disable-next-line no-process-env
      process.env.CI === 'true' &&
      !!posthogPersonalApiKey &&
      !!posthogProjectId,
    releaseName: POSTHOG_APP_NAME,
    deleteAfterUpload: true,
  },
});
