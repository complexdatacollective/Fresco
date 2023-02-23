import migrations, { Migration } from './migrations/index.js';
import { MigrationNotPossibleError, VersionMismatchError, StringVersionError } from './errors.js';

const isMigrationPathValid = (path: []) =>
  !path.some(({ migration }) => !migration);

const matchMigrations = (sourceVersion: number, targetVersion: number) =>
  ({ version }: { version: number }) =>
    version > sourceVersion && version <= targetVersion;

// Return the migration steps needed between two schema versions
const getMigrationPath = (rawSourceSchemaVersion: number | "1.0.0", targetSchemaVersion: number) => {
  if (!Number.isInteger(targetSchemaVersion)) {
    throw new StringVersionError(targetSchemaVersion, 'target');
  }

  // This is a shim for the original schema which used the format "1.0.0"
  const sourceSchemaVersion: number = rawSourceSchemaVersion === '1.0.0' ? 1 : rawSourceSchemaVersion;

  // In case string version numbers are accidentally reintroduced.
  if (!Number.isInteger(sourceSchemaVersion)) {
    throw new StringVersionError(sourceSchemaVersion, 'source');
  }

  if (sourceSchemaVersion >= targetSchemaVersion) {
    throw new VersionMismatchError(sourceSchemaVersion, targetSchemaVersion);
  }

  // Get migration steps between versions
  const migrationPath = migrations.filter((migration: Migration) => matchMigrations(sourceSchemaVersion, targetSchemaVersion)(migration));

  if (!isMigrationPathValid(migrationPath)) {
    throw new MigrationNotPossibleError(sourceSchemaVersion, targetSchemaVersion);
  }

  return migrationPath;
};

export default getMigrationPath;
