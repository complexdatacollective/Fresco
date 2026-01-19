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
  project: ['**/*.{js,jsx,ts,tsx}', '**/*.scss'],
  ignore: [
    // Tailwind plugins cannot be detected by knip
    // 'styles/plugins/tailwind-motion-spring.ts',
    // 'styles/plugins/tailwind-elevation/index.ts',
  ],
  ignoreDependencies: [
    'sharp', // Used by next/image but not directly imported
    'esbuild', // Used by Vite but not directly imported
    'sass-embedded', // Used in next.js config but not detected as used
    '@vitest/coverage-v8', // Dependency of chromatic falsely detected as unused
  ],
  ignoreBinaries: [
    'docker-compose', // Should be installed by developers if needed, not a project dependency
  ],
  // Our playwright config uses non-standard locations, so knip cannot auto-detect it
  playwright: {
    config: 'tests/e2e/playwright.config.ts',
    entry: [
      'tests/e2e/global-setup.ts',
      'tests/e2e/global-teardown.ts',
      'tests/e2e/suites/**/*.spec.ts',
    ],
  },
};

export default config;
