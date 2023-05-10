/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// await import("./env.mjs");

// @type {import("next").NextConfig} 

const withNextIntl = require('next-intl/plugin')(
  // This is the default (also the `src` folder is supported out of the box)
  './i18n.ts'
);


module.exports = withNextIntl({
  // Other Next.js configuration ...
  reactStrictMode: true,
  experimental: {
    appDir: true,
    serverActions: true,
  }
});