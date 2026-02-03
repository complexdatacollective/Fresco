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
    'styles/plugins/tailwind-motion-spring.ts',
    'styles/plugins/tailwind-elevation/index.ts',

    // Service worker files are loaded by @serwist/next plugin, not through normal imports
    'lib/pwa/sw.ts',
    'public/sw.js',

    // Offline infrastructure files for planned features (sync, conflict resolution, session management)
    // These will be integrated in future phases of offline capability
    'components/offline/ConflictResolutionDialog.tsx',
    'components/offline/ManageStorageDialog.tsx',
    'components/offline/OfflineUnavailableScreen.tsx',
    'components/offline/SessionExpiryWarning.tsx',
    'components/offline/SyncErrorSummary.tsx',
    'lib/offline/conflictResolver.ts',
    'lib/offline/interviewStorage.ts',
    'lib/offline/sessionManager.ts',
    'lib/offline/syncManager.ts',
  ],
  ignoreDependencies: [
    'sharp', // Used by next/image but not directly imported
    'esbuild', // Used by Vite but not directly imported
    'sass-embedded', // Used in next.js config but not detected as used
    '@vitest/coverage-v8', // Dependency of chromatic falsely detected as unused
    '@tailwindcss/forms', // Used in globals.css but not detected as used
    'tailwindcss-animate', // Used in globals.css but not detected as used
    'serwist', // Used in service worker file (lib/pwa/sw.ts) which is built by @serwist/next
  ],
  ignoreBinaries: [
    'docker-compose', // Should be installed by developers if needed, not a project dependency
  ],
  ignoreIssues: {
    // TestFixtures is used by Playwright via base.extend<TestFixtures>() generic type parameter
    // Knip cannot detect usage through TypeScript generic type inference
    'tests/e2e/fixtures/test.ts': ['types'],

    // Auth type is used in auth.d.ts for Lucia module augmentation (declare module 'lucia')
    // Knip cannot detect usage in ambient module declarations
    'utils/auth.ts': ['types'],

    // Offline API exports are part of the public API for offline functionality
    // These will be used in future phases or by consumers of the offline module
    'lib/offline/db.ts': ['exports', 'types'],
    'lib/offline/offlineInterviewManager.ts': ['exports', 'types'],
    'lib/offline/assetDownloadManager.ts': ['exports'],
  },
  // Our playwright config uses non-standard locations, so knip cannot auto-detect it
  playwright: {
    config: 'tests/e2e/playwright.config.ts',
    entry: [
      'tests/e2e/global-setup.ts',
      'tests/e2e/global-teardown.ts',
      'tests/e2e/suites/**/*.spec.ts',
      'tests/e2e/specs/**/*.spec.ts',
    ],
  },
};

export default config;
