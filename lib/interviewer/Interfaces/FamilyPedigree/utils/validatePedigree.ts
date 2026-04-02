import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

type ValidationIssue = {
  nodeId: string;
  nodeName: string;
  message: string;
};

function getBiologicalParentIds(
  nodeId: string,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): string[] {
  const parentIds: string[] = [];
  for (const edge of edges.values()) {
    const relType = edge.attributes[variableConfig.relationshipTypeVariable] as
      | string
      | undefined;
    if (edge.to === nodeId && relType !== 'partner' && relType !== 'social') {
      parentIds.push(edge.from);
    }
  }
  return parentIds;
}

export function validatePedigreeCompleteness(
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const egoEntry = [...nodes.entries()].find(
    ([, node]) => node.attributes[variableConfig.egoVariable] === true,
  );
  if (!egoEntry) return issues;

  const [egoId] = egoEntry;

  const egoParentIds = getBiologicalParentIds(egoId, edges, variableConfig);
  if (egoParentIds.length < 2) {
    issues.push({
      nodeId: egoId,
      nodeName: 'You',
      message: 'You must have at least two biological parents defined.',
    });
  }

  for (const parentId of egoParentIds) {
    const parent = nodes.get(parentId);
    const name = parent?.attributes[variableConfig.nodeLabelVariable];
    const nameKnown = typeof name === 'string' && name.length > 0;

    if (!nameKnown) continue;

    const parentName = name;
    const grandparentIds = getBiologicalParentIds(
      parentId,
      edges,
      variableConfig,
    );
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
