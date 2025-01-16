import {
  MigrationNotPossibleError,
  StringVersionError,
  VersionMismatchError,
} from './errors';
import { type ProtocolMigration } from './migrateProtocol';
import { migrations } from './migrations';

const isMigrationPathValid = (path: ProtocolMigration[]) =>
  !path.some(({ migration }) => !migration);

const matchMigrations =
  (sourceVersion: number, targetVersion: number) =>
  ({ version }: { version: number }) =>
    version > sourceVersion && version <= targetVersion;

const getMigrationPath = (
  sourceSchemaVersion: number,
  targetSchemaVersion: number,
) => {
  if (!Number.isInteger(sourceSchemaVersion)) {
    throw new StringVersionError(sourceSchemaVersion);
  }

  if (sourceSchemaVersion >= targetSchemaVersion) {
    throw new VersionMismatchError(sourceSchemaVersion, targetSchemaVersion);
  }

  // Get migration steps between versions
  const migrationPath = migrations.filter(
    matchMigrations(sourceSchemaVersion, targetSchemaVersion),
  );

  if (!isMigrationPathValid(migrationPath)) {
    throw new MigrationNotPossibleError(
      sourceSchemaVersion,
      targetSchemaVersion,
    );
  }

  return migrationPath;
};

export default getMigrationPath;
