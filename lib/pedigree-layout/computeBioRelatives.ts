import { type NcEdge } from '@codaco/shared-consts';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

/**
 * Compute which nodes are biological relatives of ego.
 *
 * A node is a bio-relative if connected to ego through a chain of
 * genetic contributions:
 * - 'biological' edges (always genetic)
 * - 'donor' edges (always genetic)
 * - 'surrogate' and 'social' edges are NOT genetic
 *
 * Traverses both up (to ancestors) and down (to descendants).
 */
export function computeBioRelatives(
  egoId: string,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): Set<string> {
  const bioRelatives = new Set<string>();
  bioRelatives.add(egoId);

  const geneticLinks = new Map<string, Set<string>>();

  const addLink = (a: string, b: string) => {
    let set = geneticLinks.get(a);
    if (!set) {
      set = new Set();
      geneticLinks.set(a, set);
    }
    set.add(b);
  };

  for (const edge of edges.values()) {
    const relType = edge.attributes[variableConfig.relationshipTypeVariable] as
      | string
      | undefined;
    if (relType === 'partner') continue;
    const isGenetic = relType === 'biological' || relType === 'donor';
    if (!isGenetic) continue;
    addLink(edge.from, edge.to);
    addLink(edge.to, edge.from);
  }

  const queue = [egoId];
  let current: string | undefined;
  while ((current = queue.pop()) !== undefined) {
    const neighbors = geneticLinks.get(current);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!bioRelatives.has(neighbor)) {
        bioRelatives.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return bioRelatives;
}
