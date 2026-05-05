import type { KnipConfig } from 'knip';

// NOTE: This file is named knip.config.ts rather than knip.ts (as the docs suggest)
// because of a TS resolution bug: https://github.com/webpro-nl/knip/issues/649

/**
 * Knip configuration file
 *
 * Please make sure to document any exceptions or ignores added here, so future
 * maintainers understand the reasoning behind them!
 */

const config: KnipConfig = {
  project: ['**/*.{js,jsx,ts,tsx}'],
  ignoreDependencies: [
    'sharp', // Used by next/image but not directly imported
    '@tailwindcss/forms', // Used in globals.css but not detected as used
    'tailwindcss-animate', // Used in globals.css but not detected as used
    '@prisma/client', // Used at runtime by Prisma generated client (imports @prisma/client/runtime/client)
  ],
  ignoreBinaries: [
    'netlify', // Installed during CI via pnpm add -g netlify-cli
  ],
  ignoreIssues: {
    // Server actions for passkey password management — UI not yet wired
    'actions/webauthn.ts': ['exports'],

    // Pre-existing unused type exports
    'lib/protocol/validateAndMigrateProtocol.ts': ['types'],
  },
};

export default config;
