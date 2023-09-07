import getMigrationPath from './getMigrationPath';

const canUpgrade = (sourceSchemaVersion, targetSchemaVersion) => {
  try {
    getMigrationPath(sourceSchemaVersion, targetSchemaVersion);
  } catch (e) {
    return false;
  }

  return true;
};

export default canUpgrade;
