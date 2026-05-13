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
  test: {
    globals: true,
    exclude: ['**/node_modules/**'],
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
          server: {
            deps: { inline: ['@codaco/interview'] },
          },
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
