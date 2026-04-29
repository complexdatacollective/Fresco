import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  // Pre-bundle dependencies that Vite's import scanner can't discover
  // statically, so they're ready before any test runs. Without this, Vite
  // finds them mid-test, re-bundles, and *reloads the page* — which tears
  // down Playwright's connection and surfaces as flaky failures or browser
  // disconnects.
  //
  // - `fuse.js` is imported only from `lib/collection/filtering/search.worker.ts`;
  //   Vite's scanner doesn't crawl into web workers.
  // - `d3-force` is imported lazily by the FamilyPedigree pedigree-layout, which only
  //   mounts after a specific story runs.
  optimizeDeps: {
    include: ['d3-force', 'fuse.js'],
  },
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/tests/e2e/**'], // Exclude Playwright E2E tests
    projects: [
      {
        extends: true,
        test: {
          environment: 'jsdom',
          exclude: [
            '**/*.stories.tsx', // Exclude Storybook files from unit tests
            '**/*.stories.ts',
          ],
          name: 'units',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript:
              'SKIP_ENV_VALIDATION=true storybook dev -p 6006 --no-open',
          }),
        ],
        test: {
          name: 'storybook',
          testTimeout: 60000,
          browser: {
            provider: playwright(),
            enabled: true,
            instances: [{ browser: 'chromium' }],
            headless: true,
          },
          exclude: [
            '**/*.test.ts', // Exclude regular test files from Storybook tests
            '**/*.test.tsx',
          ],
        },
      },
    ],
  },
});
