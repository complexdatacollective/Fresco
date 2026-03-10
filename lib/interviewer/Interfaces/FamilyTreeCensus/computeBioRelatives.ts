import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

/**
 * Compute which nodes are biological relatives of ego.
 *
 * A node is a bio-relative if connected to ego through a chain of
 * genetic contributions:
 * - 'parent' edges where biological !== false (defaults to true)
 * - 'donor' edges (always genetic)
 * - 'surrogate' edges are NOT genetic
 *
 * Traverses both up (to ancestors) and down (to descendants).
 */
export function computeBioRelatives(
  egoId: string,
  edges: Map<string, StoreEdge>,
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
    if (edge.type !== 'parent') continue;
    const isGenetic =
      edge.edgeType === 'donor' ||
      (edge.edgeType === 'parent' && edge.biological !== false);
    if (!isGenetic) continue;
    addLink(edge.source, edge.target);
    addLink(edge.target, edge.source);
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
