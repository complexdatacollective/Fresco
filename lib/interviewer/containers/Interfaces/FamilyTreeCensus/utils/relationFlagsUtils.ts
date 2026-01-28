import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { type Edge } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';

export type RelationFlags = {
  hasAuntOrUncle: boolean;
  hasSiblings: boolean;
  hasChildren: boolean;
  hasParentExPartner: boolean;
};

/**
 * Analyzes nodes and edges to determine what relationship options should be available.
 *
 * @param nodes - Array of family tree nodes
 * @param edges - Optional map of edges (for detecting ex-partners)
 * @param parentIds - Optional object with fatherId and motherId to check for parent ex-partners
 * @returns Flags indicating which relationship types are available
 */
export function getRelationFlags(
  nodes: FamilyTreeNodeType[],
  edges?: Map<string, Edge>,
  parentIds?: { fatherId?: string; motherId?: string },
): RelationFlags {
  const hasAuntOrUncle = nodes.some((n) => /\b(aunt|uncle)\b/i.test(n.label));
  const hasSiblings = nodes.some((n) =>
    ['brother', 'sister', 'halfBrother', 'halfSister'].includes(n.label),
  );
  const hasChildren = nodes.some((n) => ['son', 'daughter'].includes(n.label));

  // Check if Father or Mother specifically has an ex-partner
  let hasParentExPartner = false;
  if (edges && parentIds) {
    const { fatherId, motherId } = parentIds;
    for (const edge of edges.values()) {
      if (edge.relationship === 'ex-partner') {
        // Check if father or mother is involved in this ex-partner edge
        if (
          (fatherId && (edge.source === fatherId || edge.target === fatherId)) ||
          (motherId && (edge.source === motherId || edge.target === motherId))
        ) {
          hasParentExPartner = true;
          break;
        }
      }
    }
  }

  return { hasAuntOrUncle, hasSiblings, hasChildren, hasParentExPartner };
}

/**
 * Builds the list of relationship options based on flags.
 *
 * @param flags - Flags from getRelationFlags
 * @returns Array of relationship options
 */
export function buildBaseOptions(flags: RelationFlags) {
  const opts = [
    { label: 'Aunt', value: 'aunt' },
    { label: 'Uncle', value: 'uncle' },
    { label: 'Daughter', value: 'daughter' },
    { label: 'Son', value: 'son' },
    { label: 'Brother', value: 'brother' },
    { label: 'Sister', value: 'sister' },
    { label: 'Ex-Partner', value: 'exPartner' },
  ];

  // Half-sibling options only appear when an ex-partner exists
  // Users must create an ex-partner first before adding half-siblings
  if (flags.hasParentExPartner) {
    opts.push(
      { label: 'Half Sister', value: 'halfSister' },
      { label: 'Half Brother', value: 'halfBrother' },
    );
  }

  if (flags.hasAuntOrUncle) {
    opts.push(
      { label: 'First Cousin (Male)', value: 'firstCousinMale' },
      { label: 'First Cousin (Female)', value: 'firstCousinFemale' },
    );
  }

  if (flags.hasSiblings) {
    opts.push(
      { label: 'Niece', value: 'niece' },
      { label: 'Nephew', value: 'nephew' },
    );
  }

  if (flags.hasChildren) {
    opts.push(
      { label: 'Granddaughter', value: 'granddaughter' },
      { label: 'Grandson', value: 'grandson' },
    );
  }

  return opts;
}
