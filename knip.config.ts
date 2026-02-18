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
  ignore: [
    // Tailwind plugins loaded via @plugin in CSS cannot be detected by knip
    'styles/plugins/tailwind-motion-spring.ts',
    'styles/plugins/tailwind-elevation/index.ts',
    'styles/plugins/tailwind-inset-surface/index.ts',
  ],
  ignoreDependencies: [
    'sharp', // Used by next/image but not directly imported
    'esbuild', // Used by Vite but not directly imported
    'sass-embedded', // Used in next.js config but not detected as used
    '@vitest/coverage-v8', // Dependency of chromatic falsely detected as unused
    '@tailwindcss/forms', // Used in globals.css but not detected as used
    'tailwindcss-animate', // Used in globals.css but not detected as used
    '@prisma/client', // Used at runtime by Prisma generated client (imports @prisma/client/runtime/client)
  ],
  ignoreBinaries: [
    'docker-compose', // Should be installed by developers if needed, not a project dependency
    'netlify', // Installed during CI via pnpm add -g netlify-cli
  ],
  ignoreIssues: {
    // TestFixtures is used by Playwright via base.extend<TestFixtures>() generic type parameter
    // Knip cannot detect usage through TypeScript generic type inference
    'tests/e2e/fixtures/test.ts': ['types', 'exports'],

    // Table helpers are part of the public test API used by future specs
    'tests/e2e/helpers/table.ts': ['exports'],

    // Pre-existing unused type exports (not related to e2e migration)
    'lib/interviewer/containers/Interfaces/FamilyTreeCensus/useDynamicFields.tsx':
      ['types'],
    'lib/protocol/validateAndMigrateProtocol.ts': ['types'],
    'lib/uploadthing/presigned.ts': ['types'],
  },
  // Our playwright config uses non-standard locations, so knip cannot auto-detect it
  playwright: {
    config: 'tests/e2e/playwright.config.ts',
    entry: [
      'tests/e2e/global-setup.ts',
      'tests/e2e/global-teardown.ts',
      'tests/e2e/specs/**/*.spec.ts',
    ],
  },
};

export default config;
