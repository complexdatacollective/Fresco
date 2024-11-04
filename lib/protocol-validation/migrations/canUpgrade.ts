import getMigrationPath from "./getMigrationPath";

export const canUpgrade = (
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
