// @ts-check

import('./env.js');
import ChildProcess from 'node:child_process';
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

/** @type {import("next").NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    webpackBuildWorker: true,
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
export default config;
