import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import', // Silences warnings related to @import
          'mixed-decls', // Silences warnings related to mixed declarations
          'color-functions', // Silences warnings related to deprecated color functions
          'global-builtin', // Silences warnings related to global built-in functions
          'legacy-js-api', // Silences warnings related to the legacy JS API
        ],
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/tests/e2e/**'], // Exclude Playwright E2E tests
    projects: [
      {
        extends: true,
        test: {
          exclude: [
            '**/*.stories.tsx', // Exclude Storybook files from unit tests
            '**/*.stories.ts',
          ],
          name: 'unit tests',
        },
        resolve: {
          alias: {
            // Reference the internal react package shipped in next.js
            react: 'next/dist/compiled/react/cjs/react.development.js',
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            provider: 'playwright',
            enabled: true,
            instances: [{ browser: 'chromium' }],
          },
          exclude: [
            '**/*.test.ts', // Exclude regular test files from Storybook tests
            '**/*.test.tsx',
          ],
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
