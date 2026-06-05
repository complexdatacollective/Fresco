import { describe, expect, it } from 'vitest';
import { getSemverUpdateType } from '~/utils/semVer';

const currentVersion = { major: 1, minor: 2, patch: 3 };

describe('getSemverUpdateType', () => {
  it('returns "major" when new major version is higher', () => {
    expect(
      getSemverUpdateType(currentVersion, { major: 2, minor: 0, patch: 0 }),
    ).toBe('major');
    expect(
      getSemverUpdateType(currentVersion, { major: 2, minor: 2, patch: 3 }),
    ).toBe('major');
  });

  it('returns "minor" when major is the same and new minor version is higher', () => {
    expect(
      getSemverUpdateType(currentVersion, { major: 1, minor: 3, patch: 0 }),
    ).toBe('minor');
    expect(
      getSemverUpdateType(currentVersion, { major: 1, minor: 3, patch: 3 }),
    ).toBe('minor');
  });

  it('returns "patch" when major and minor are the same and new patch version is higher', () => {
    expect(
      getSemverUpdateType(currentVersion, { major: 1, minor: 2, patch: 4 }),
    ).toBe('patch');
  });

  it('returns null when versions are identical', () => {
    expect(
      getSemverUpdateType(currentVersion, { major: 1, minor: 2, patch: 3 }),
    ).toBe(null);
  });

  it('returns null when new version is lower than current version', () => {
    expect(
      getSemverUpdateType(currentVersion, { major: 1, minor: 2, patch: 2 }),
    ).toBe(null);
    expect(
      getSemverUpdateType(currentVersion, { major: 1, minor: 1, patch: 3 }),
    ).toBe(null);
    expect(
      getSemverUpdateType(currentVersion, { major: 0, minor: 9, patch: 5 }),
    ).toBe(null);
  });

  it('returns correct type when versions differ across all parts', () => {
    // Major is higher
    expect(
      getSemverUpdateType(
        { major: 1, minor: 0, patch: 0 },
        { major: 2, minor: 1, patch: 1 },
      ),
    ).toBe('major');
    // Minor is higher
    expect(
      getSemverUpdateType(
        { major: 1, minor: 1, patch: 0 },
        { major: 1, minor: 2, patch: 0 },
      ),
    ).toBe('minor');
    // Patch is higher
    expect(
      getSemverUpdateType(
        { major: 1, minor: 2, patch: 3 },
        { major: 1, minor: 2, patch: 4 },
      ),
    ).toBe('patch');
  });
});
