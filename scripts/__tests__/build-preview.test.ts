import { describe, expect, it } from 'vitest';

import { previewBuildScript } from '~/scripts/build-preview';

describe('previewBuildScript', () => {
  it("migrates a preview's database when it is the preview's own", () => {
    expect(
      previewBuildScript({
        gitBranch: 'schema-9',
        previewDatabaseBranch: 'preview/schema-9',
      }),
    ).toBe('build:platform');
  });

  it('never migrates a database the preview did not get for itself', () => {
    // No preview database: the deployment's previews read production's.
    expect(
      previewBuildScript({
        gitBranch: 'schema-9',
        previewDatabaseBranch: undefined,
      }),
    ).toBe('build:branch-preview');
    // Another branch's value, however it got here.
    expect(
      previewBuildScript({
        gitBranch: 'feature',
        previewDatabaseBranch: 'preview/schema-9',
      }),
    ).toBe('build:branch-preview');
    expect(
      previewBuildScript({
        gitBranch: undefined,
        previewDatabaseBranch: 'preview/undefined',
      }),
    ).toBe('build:branch-preview');
  });
});
