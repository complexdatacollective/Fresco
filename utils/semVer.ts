import { z } from 'zod';

export const semverSchema = z
  .string()
  .regex(
    /^v(\d+)\.(\d+)\.(\d+)$/,
    "Invalid version format. Expected format is 'v1.2.3'.",
  )
  .transform((version) => {
    const [, major, minor, patch] = /^v(\d+)\.(\d+)\.(\d+)$/.exec(
      version,
    ) as string[];

    if (!major || !minor || !patch) {
      throw new Error('Invalid version format');
    }

    // Convert version parts to numbers
    const majorNum = parseInt(major, 10);
    const minorNum = parseInt(minor, 10);
    const patchNum = parseInt(patch, 10);

    return {
      major: majorNum,
      minor: minorNum,
      patch: patchNum,
      toString() {
        return `v${majorNum}.${minorNum}.${patchNum}`;
      },
    };
  });

type SemVer = z.infer<typeof semverSchema>;

export function getSemverUpdateType(
  currentVersion: SemVer,
  newVersion: SemVer,
): 'major' | 'minor' | 'patch' | null {
  // early return if versions are identical
  if (currentVersion === newVersion) {
    return null;
  }

  if (newVersion.major > currentVersion.major) {
    return 'major';
  }

  if (newVersion.major === currentVersion.major) {
    if (newVersion.minor > currentVersion.minor) {
      return 'minor';
    }

    if (newVersion.minor === currentVersion.minor) {
      if (newVersion.patch > currentVersion.patch) {
        return 'patch';
      }
    }
  }

  // If we reach this point, we know the current version is higher than the new version
  return null;
}
