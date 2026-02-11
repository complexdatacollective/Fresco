import type { KnipConfig } from 'knip';

// NOTE: This file is named knip.config.ts rather than knip.ts (as the docs suggest)
// because of a TS resolution bug: https://github.com/webpro-nl/knip/issues/649

const config: KnipConfig = {
  project: ['**/*.{js,jsx,ts,tsx}', '**/*.scss'],
  ignore: [
    // Tailwind plugin cannot be detected by knip
    'styles/tailwind-motion-spring.ts',
    // E2E helper modules used by future test specs (not yet ported from new-form-system)
    'tests/e2e/helpers/dialog.ts',
    'tests/e2e/helpers/form.ts',
    'tests/e2e/helpers/row-actions.ts',
  ],
  ignoreDependencies: [
    'sharp', // Used by next/image but not directly imported
    'esbuild', // Used by Vite but not directly imported
    '@tailwindcss/forms', // Used in globals.css but not detected as used
    'tailwindcss-animate', // Used in globals.css but not detected as used
    '@tailwindcss/aspect-ratio', // Used in globals.css but not detected as used
    '@tailwindcss/container-queries', // Used in globals.css but not detected as used
    '@tailwindcss/typography', // Used in globals.css but not detected as used
    'testcontainers', // Peer dependency of @testcontainers/postgresql
  ],
  ignoreBinaries: [
    'docker-compose', // Should be installed by developers if needed, not a project dependency
    'netlify', // Installed globally in CI workflow, not a project dependency
  ],
  ignoreIssues: {
    // TestFixtures/WorkerFixtures are used by Playwright via base.extend<>() generic type parameter.
    // expectURL is part of the public test API used by future specs.
    // Knip cannot detect usage through TypeScript generic type inference.
    'tests/e2e/fixtures/test.ts': ['types', 'exports'],

    // Table helpers are part of the public test API used by future specs
    'tests/e2e/helpers/table.ts': ['exports'],

    // Auth type is used in auth.d.ts for Lucia module augmentation (declare module 'lucia')
    // Knip cannot detect usage in ambient module declarations
    'utils/auth.ts': ['types'],

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
