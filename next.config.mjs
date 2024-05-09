/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import('./env.mjs');
import pkg from './package.json' with { type: 'json' };
import ChildProcess from 'child_process';

// starts a command line process to get the git hash
const commitHash = ChildProcess
  .execSync('git log --pretty=format:"%h" -n1')
  .toString()
  .trim();

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
        filename: 'static/chunks/[path][name].[hash][ext]'
      },
    });

    // add the node-rs externals to the webpack config so they arent bundled: https://lucia-auth.com/getting-started/nextjs-app
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");

    return config;
  },
  env: {
    // add the package.json version and git hash to the environment
    APP_VERSION: pkg.version,
    COMMIT_HASH: commitHash
  }
};
export default config;
