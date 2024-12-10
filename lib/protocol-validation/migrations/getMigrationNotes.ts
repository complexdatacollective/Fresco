import getMigrationPath from './getMigrationPath';

const getMigrationNotes = (
  sourceSchemaVersion: number,
  targetSchemaVersion: number,
) => {
  try {
    const migrationPath = getMigrationPath(
      sourceSchemaVersion,
      targetSchemaVersion,
    );

    const notes = migrationPath.reduce(
      (acc: { notes?: string; version: number }[], migration) => {
        if (!migration.notes) {
          return acc;
        }
        return [...acc, { notes: migration.notes, version: migration.version }];
      },
      [],
    );
    return notes;
  } catch (e) {
    return undefined;
  }
};

export default getMigrationNotes;
