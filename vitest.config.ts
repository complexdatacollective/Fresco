import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, transformWithEsbuild } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
            '**/tests/e2e/**', // Exclude Playwright E2E tests
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
        resolve: {
          alias: {
            '~': path.resolve(__dirname, './'),
          },
        },
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
        plugins: [
          react(),
          tsconfigPaths(),
          {
            name: 'treat-js-files-as-jsx',
            async transform(code, id) {
              if (!id.match(/src\/.*\.js$/)) return null;

              // Use the exposed transform from vite, instead of directly
              // transforming with esbuild
              return transformWithEsbuild(code, id, {
                loader: 'jsx',
                jsx: 'automatic',
              });
            },
          },
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        optimizeDeps: {
          force: true,
          esbuildOptions: {
            loader: {
              '.js': 'jsx',
            },
          },
        },
        test: {
          name: 'storybook',
          browser: {
            provider: 'playwright',
            enabled: true,
            instances: [{ browser: 'chromium' }],
          },
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/tests/e2e/**', // Exclude Playwright E2E tests
          ],
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
