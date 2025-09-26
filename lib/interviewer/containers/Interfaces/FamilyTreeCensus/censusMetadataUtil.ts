import { type PlaceholderNodeProps } from './FamilyTreeNode';

type StageMetadataSchema = [number, string, string, boolean];
const FAMILY_TREE_KEY = 'allCensusNodes';

// updates the family tree entry in stageMetadata or adds it if missing
export function updateFamilyTreeMetadata(
  stageMetadata: StageMetadataSchema[],
  updatedNodes: PlaceholderNodeProps[],
): StageMetadataSchema[] {
  const jsonString = JSON.stringify(updatedNodes);

  const existingIndex = stageMetadata.findIndex(
    ([, key]) => key === FAMILY_TREE_KEY,
  );

  if (existingIndex !== -1) {
    const newEntry: StageMetadataSchema = [
      0,
      FAMILY_TREE_KEY,
      jsonString,
      false,
    ];
    return [
      ...stageMetadata.slice(0, existingIndex),
      newEntry,
      ...stageMetadata.slice(existingIndex + 1),
    ];
  }

  // add new entry if missing
  const newEntry: StageMetadataSchema = [0, FAMILY_TREE_KEY, jsonString, false];
  return [...stageMetadata, newEntry];
}

// retrieves the parsed family tree nodes from stageMetadata
export function getFamilyTreeNodes(
  stageMetadata: StageMetadataSchema[],
): PlaceholderNodeProps[] {
  const entry = stageMetadata.find(([, key]) => key === FAMILY_TREE_KEY);
  return entry ? JSON.parse(entry[2]) : [];
}
