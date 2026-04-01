import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

type ValidationIssue = {
  nodeId: string;
  nodeName: string;
  message: string;
};

function getBiologicalParentIds(
  nodeId: string,
  edges: Map<string, StoreEdge>,
): string[] {
  const parentIds: string[] = [];
  for (const edge of edges.values()) {
    if (
      edge.target === nodeId &&
      edge.relationshipType !== 'partner' &&
      edge.relationshipType !== 'social'
    ) {
      parentIds.push(edge.source);
    }
  }
  return parentIds;
}

export function validatePedigreeCompleteness(
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  nodeLabelVariable: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const egoEntry = [...nodes.entries()].find(([, node]) => node.isEgo);
  if (!egoEntry) return issues;

  const [egoId] = egoEntry;

  const egoParentIds = getBiologicalParentIds(egoId, edges);
  if (egoParentIds.length < 2) {
    issues.push({
      nodeId: egoId,
      nodeName: 'You',
      message: 'You must have at least two biological parents defined.',
    });
  }

  for (const parentId of egoParentIds) {
    const parent = nodes.get(parentId);
    const name = parent?.attributes[nodeLabelVariable];
    const nameKnown = typeof name === 'string' && name.length > 0;

    if (!nameKnown) continue;

    const parentName = name;
    const grandparentIds = getBiologicalParentIds(parentId, edges);
    if (grandparentIds.length < 2) {
      issues.push({
        nodeId: parentId,
        nodeName: parentName,
        message: `${parentName} must have at least two biological parents defined.`,
      });
    }
  }

  return issues;
}
