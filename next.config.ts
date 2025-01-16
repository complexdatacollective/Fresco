import { type NextConfig } from 'next';
import ChildProcess from 'node:child_process';
import './env';
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
  }
}

/** @type {import("next").NextConfig} */
const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    reactCompiler: true,
  },
  env: {
    // add the package.json version and git hash to the environment
    APP_VERSION: `v${pkg.version}`,
    COMMIT_HASH: commitHash,
  },
  eslint: {
    dirs: ['./'],
  },
};
export default config;
