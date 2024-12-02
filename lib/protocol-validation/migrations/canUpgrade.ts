import getMigrationPath from './getMigrationPath';

const canUpgrade = (
  sourceSchemaVersion: number,
  targetSchemaVersion: number,
) => {
  try {
    getMigrationPath(sourceSchemaVersion, targetSchemaVersion);
  } catch (e) {
    return false;
  }

  return true;
};

export default canUpgrade;
