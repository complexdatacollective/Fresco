import ChildProcess from 'node:child_process';

import { withPostHogConfig } from '@posthog/nextjs-config';
import type { NextConfig } from 'next';

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
      // `strict-origin-when-cross-origin` applies to the participant routes
      // (`/interview/*`, `/onboard/*`) as well, on purpose. Their URLs carry the
      // interview id, which is the unauthenticated participant access
      // capability, and this policy never sends the path cross-origin: a
      // third-party sub-resource sees only the scheme and host, and nothing at
      // all on an HTTPS→HTTP downgrade. Sending the origin is what lets a
      // Geospatial stage work with a URL-restricted Mapbox token, which Mapbox
      // evaluates from the Referer header and rejects with 403 when it is
      // absent. Do not tighten these routes to `no-referrer` again: it strips
      // the origin too and breaks every restricted token, while protecting
      // nothing this policy already withholds.
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains',
      },
    ];

    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
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
