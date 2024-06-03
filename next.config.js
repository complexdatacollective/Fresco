import('./env.js');
import ChildProcess from 'node:child_process';
import pkg from './package.json' with { type: 'json' };


let commitHash = 'Unknown commit hash';

try {
  commitHash = ChildProcess.execSync('git log --pretty=format:"%h" -n1')
    .toString()
    .trim()
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Error getting commit hash:', error);
}

/** @type {import("next").NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    webpackBuildWorker: true,
  },
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
    APP_VERSION: pkg.version,
    COMMIT_HASH: commitHash,
  },
  eslint: {
    dirs: ['./'],
  }
};
export default config;
