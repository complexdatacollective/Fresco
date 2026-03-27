import {
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

type PathStep = 'parent' | 'child' | 'partner';

type BfsEntry = {
  nodeId: string;
  path: PathStep[];
  /** Node IDs along the path (excluding ego and the target node). */
  intermediaries: string[];
};

/**
 * BFS from ego, recording the edge-type path to every reachable node.
 * Returns a Map from nodeId to the shortest path info.
 */
function bfsFromEgo(
  egoId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
): Map<string, BfsEntry> {
  const result = new Map<string, BfsEntry>();
  const visited = new Set<string>([egoId]);
  const queue: BfsEntry[] = [{ nodeId: egoId, path: [], intermediaries: [] }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const edge of edges.values()) {
      if (edge.relationshipType === 'partner') {
        // Partner edges are bidirectional
        let neighborId: string | null = null;
        if (edge.source === current.nodeId) neighborId = edge.target;
        else if (edge.target === current.nodeId) neighborId = edge.source;

        if (neighborId && !visited.has(neighborId) && nodes.has(neighborId)) {
          visited.add(neighborId);
          const entry: BfsEntry = {
            nodeId: neighborId,
            path: [...current.path, 'partner'],
            intermediaries:
              current.nodeId === egoId
                ? []
                : [...current.intermediaries, current.nodeId],
          };
          result.set(neighborId, entry);
          queue.push(entry);
        }
        continue;
      }

      // Parent edge: source is parent, target is child
      // Traversing "up" (child -> parent): current is target, neighbor is source
      if (edge.target === current.nodeId) {
        const neighborId = edge.source;
        if (!visited.has(neighborId) && nodes.has(neighborId)) {
          visited.add(neighborId);
          const entry: BfsEntry = {
            nodeId: neighborId,
            path: [...current.path, 'parent'],
            intermediaries:
              current.nodeId === egoId
                ? []
                : [...current.intermediaries, current.nodeId],
          };
          result.set(neighborId, entry);
          queue.push(entry);
        }
      }

      // Traversing "down" (parent -> child): current is source, neighbor is target
      if (edge.source === current.nodeId) {
        const neighborId = edge.target;
        if (!visited.has(neighborId) && nodes.has(neighborId)) {
          visited.add(neighborId);
          const entry: BfsEntry = {
            nodeId: neighborId,
            path: [...current.path, 'child'],
            intermediaries:
              current.nodeId === egoId
                ? []
                : [...current.intermediaries, current.nodeId],
          };
          result.set(neighborId, entry);
          queue.push(entry);
        }
      }
    }
  }

  return result;
}

type RelationshipKind =
  | 'parent'
  | 'social-parent'
  | 'donor'
  | 'surrogate'
  | 'child'
  | 'partner'
  | 'sibling'
  | 'step-parent'
  | 'step-child'
  | 'grandparent'
  | 'grandparent-partner'
  | 'grandchild'
  | 'aunt-uncle'
  | 'cousin'
  | 'niece-nephew'
  | 'sibling-in-law'
  | 'child-in-law'
  | 'great-grandparent'
  | 'great-grandchild';

function classifyPath(path: PathStep[]): RelationshipKind | null {
  const key = path.join(',');

  const directMap: Record<string, RelationshipKind> = {
    'parent': 'parent',
    'child': 'child',
    'partner': 'partner',
    'parent,partner': 'step-parent',
    'partner,child': 'step-child',
    'parent,parent': 'grandparent',
    'parent,parent,partner': 'grandparent-partner',
    'parent,parent,parent': 'great-grandparent',
    'child,child': 'grandchild',
    'child,child,child': 'great-grandchild',
    'child,partner': 'child-in-law',
    'parent,parent,child': 'aunt-uncle',
    'parent,parent,child,child': 'cousin',
  };

  if (directMap[key]) return directMap[key];

  // Sibling: parent,child where the child is NOT ego (handled by BFS — ego is never revisited)
  if (key === 'parent,child') return 'sibling';
  if (key === 'parent,child,partner') return 'sibling-in-law';
  if (key === 'parent,child,child') return 'niece-nephew';

  return null;
}

/**
 * Determine the parent edge type for a direct parent of ego.
 */
function getParentEdgeType(
  nodeId: string,
  egoId: string,
  edges: Map<string, StoreEdge>,
): StoreEdge['relationshipType'] | null {
  for (const edge of edges.values()) {
    if (
      edge.source === nodeId &&
      edge.target === egoId &&
      edge.relationshipType !== 'partner'
    ) {
      return edge.relationshipType;
    }
  }
  return null;
}

const RELATIONSHIP_LABELS: Record<RelationshipKind, string> = {
  'parent': 'Parent',
  'social-parent': 'Social Parent',
  'donor': 'Donor',
  'surrogate': 'Surrogate',
  'child': 'Child',
  'partner': 'Partner',
  'sibling': 'Sibling',
  'step-parent': 'Step-Parent',
  'step-child': 'Step-Child',
  'grandparent': 'Grandparent',
  'grandparent-partner': "Grandparent's Partner",
  'grandchild': 'Grandchild',
  'aunt-uncle': 'Aunt/Uncle',
  'cousin': 'Cousin',
  'niece-nephew': 'Niece/Nephew',
  'sibling-in-law': "Sibling's Partner",
  'child-in-law': "Child's Partner",
  'great-grandparent': 'Great-Grandparent',
  'great-grandchild': 'Great-Grandchild',
};

// Relationships that use maternal/paternal lineage prefix
const LINEAGE_RELATIONSHIPS = new Set<RelationshipKind>([
  'grandparent',
  'grandparent-partner',
  'great-grandparent',
  'aunt-uncle',
  'cousin',
]);

/**
 * Find the nearest named intermediary on the path, searching from the
 * target node back toward ego.
 */
function findNearestNamedIntermediary(
  intermediaries: string[],
  nodes: Map<string, NodeData>,
  variableConfig: VariableConfig,
): { name: string; index: number } | null {
  // Search from end (closest to target) back toward ego
  for (let i = intermediaries.length - 1; i >= 0; i--) {
    const node = nodes.get(intermediaries[i]!);
    const name = node?.attributes[variableConfig.nodeLabelVariable] as
      | string
      | undefined;
    if (name) return { name, index: i };
  }
  return null;
}

/**
 * Determine the relationship label from the intermediary to the target node.
 * This is the "last hop" label used in possessive form: "{name}'s {label}".
 */
function getLastHopLabel(path: PathStep[]): string {
  const lastStep = path[path.length - 1];
  if (lastStep === 'parent') return 'Parent';
  if (lastStep === 'child') return 'Child';
  if (lastStep === 'partner') return 'Partner';
  return 'Relative';
}

/**
 * Determine lineage prefix (Maternal/Paternal) based on the ego's parent
 * through whom the path passes.
 */
function getLineagePrefix(
  entry: BfsEntry,
  _egoId: string,
  nodes: Map<string, NodeData>,
  _edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): string {
  // The first step in the path should be 'parent' for lineage relationships.
  // The first intermediary (or the node itself for 1-hop) is ego's parent.
  const firstIntermediaryId = entry.intermediaries[0] ?? entry.nodeId;

  // If the first intermediary is the node itself (direct parent), check the
  // node's own sex. Otherwise check the intermediary's sex.
  const parentNode = nodes.get(firstIntermediaryId);
  const parentSex = parentNode?.attributes[
    variableConfig.biologicalSexVariable
  ] as string | undefined;

  if (parentSex === 'female') return 'Maternal';
  if (parentSex === 'male') return 'Paternal';
  return '';
}

/**
 * Compute the display label for a single node in the pedigree.
 *
 * Returns the node's stored name if it has one. Otherwise computes a
 * relationship-based label using named intermediaries when available
 * ("Rob's Parent") or lineage-based fallbacks ("Paternal Grandparent").
 */
export function getDisplayLabel(
  nodeId: string,
  egoId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): string {
  const node = nodes.get(nodeId);
  if (!node) return 'Family Member';

  // Return stored name if present
  const storedName = node.attributes[variableConfig.nodeLabelVariable] as
    | string
    | undefined;
  if (storedName) return storedName;

  // BFS to find path from ego to this node
  const bfsResults = bfsFromEgo(egoId, nodes, edges);
  const entry = bfsResults.get(nodeId);
  if (!entry) return 'Family Member';

  // Classify the relationship from the path
  let kind = classifyPath(entry.path);
  if (!kind) return 'Family Member';

  // For direct parents, refine the kind based on edge type
  if (kind === 'parent') {
    const edgeType = getParentEdgeType(nodeId, egoId, edges);
    if (edgeType === 'social') kind = 'social-parent';
    else if (edgeType === 'donor') kind = 'donor';
    else if (edgeType === 'surrogate') kind = 'surrogate';
  }

  // Relationships where the direct label is more descriptive than possessive form
  const SKIP_INTERMEDIARY = new Set<RelationshipKind>([
    'sibling',
    'sibling-in-law',
  ]);

  // Tier 1: Named intermediary label
  if (!SKIP_INTERMEDIARY.has(kind)) {
    const intermediary = findNearestNamedIntermediary(
      entry.intermediaries,
      nodes,
      variableConfig,
    );
    if (intermediary) {
      const lastHop = getLastHopLabel(entry.path);
      return `${intermediary.name}'s ${lastHop}`;
    }
  }

  // Tier 2: Lineage-based fallback
  const baseLabel = RELATIONSHIP_LABELS[kind];
  if (LINEAGE_RELATIONSHIPS.has(kind)) {
    const prefix = getLineagePrefix(entry, egoId, nodes, edges, variableConfig);
    return prefix ? `${prefix} ${baseLabel}` : baseLabel;
  }

  return baseLabel;
}

/**
 * Compute display labels for all unnamed nodes in a single BFS pass.
 * More efficient than calling getDisplayLabel per-node when labelling
 * the entire graph.
 */
export function computeAllDisplayLabels(
  egoId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): Map<string, string> {
  const bfsResults = bfsFromEgo(egoId, nodes, edges);
  const labels = new Map<string, string>();

  const SKIP_INTERMEDIARY = new Set<RelationshipKind>([
    'sibling',
    'sibling-in-law',
  ]);

  for (const [nodeId, node] of nodes) {
    if (node.isEgo) continue;

    const storedName = node.attributes[variableConfig.nodeLabelVariable] as
      | string
      | undefined;
    if (storedName) continue;

    const entry = bfsResults.get(nodeId);
    if (!entry) {
      labels.set(nodeId, 'Family Member');
      continue;
    }

    let kind = classifyPath(entry.path);
    if (!kind) {
      labels.set(nodeId, 'Family Member');
      continue;
    }

    if (kind === 'parent') {
      const edgeType = getParentEdgeType(nodeId, egoId, edges);
      if (edgeType === 'social') kind = 'social-parent';
      else if (edgeType === 'donor') kind = 'donor';
      else if (edgeType === 'surrogate') kind = 'surrogate';
    }

    if (!SKIP_INTERMEDIARY.has(kind)) {
      const intermediary = findNearestNamedIntermediary(
        entry.intermediaries,
        nodes,
        variableConfig,
      );
      if (intermediary) {
        const lastHop = getLastHopLabel(entry.path);
        labels.set(nodeId, `${intermediary.name}'s ${lastHop}`);
        continue;
      }
    }

    const baseLabel = RELATIONSHIP_LABELS[kind];
    if (LINEAGE_RELATIONSHIPS.has(kind)) {
      const prefix = getLineagePrefix(
        entry,
        egoId,
        nodes,
        edges,
        variableConfig,
      );
      labels.set(nodeId, prefix ? `${prefix} ${baseLabel}` : baseLabel);
    } else {
      labels.set(nodeId, baseLabel);
    }
  }

  return labels;
}
