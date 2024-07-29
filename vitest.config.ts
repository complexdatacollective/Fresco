import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom', // Defauult, but see below.
    // Tests for actions/queries shouldn't use the browser environment, because
    // they can potentially import RSC modules (such as 'server-only') which
    // don't export browser versions (meaning you can't mock them).
    //
    // See:
    //   - https://github.com/vercel/next.js/issues/47448
    //   - https://github.com/vercel/next.js/issues/60038
    //
    // If you are here because your test is failing, but you can't add the whole
    // path to the list below, you can also add
    // `/** @vitest-environment node */` to the top of the test file on a
    // case-by-case.
    environmentMatchGlobs: [
      // all tests in tests/dom will run in jsdom
      ['actions/**', 'node'],
      // ...
    ],
  },
});
