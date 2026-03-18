import path from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const mainNodeModules = path.resolve(__dirname, '../../..', 'node_modules');

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Worktree has React 18 but @testing-library/react resolves React 19
      // from the parent repo. Alias to the parent's React 19 for consistency.
      'react': path.resolve(mainNodeModules, 'react'),
      'react-dom': path.resolve(mainNodeModules, 'react-dom'),
    },
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        // Force all deps through Vite's resolver so React aliases apply
        // universally. Without this, pnpm-resolved packages in the worktree
        // link to a different React version than @testing-library/react.
        inline: [/@tanstack/, /@testing-library/, /nuqs/],
      },
    },
  },
});
