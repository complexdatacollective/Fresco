import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { type Edge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export type RelationFlags = {
  hasAuntOrUncle: boolean;
  hasSiblings: boolean;
  hasChildren: boolean;
  hasParentWithMultiplePartners: boolean;
  hasGrandparentWithMultiplePartners: boolean;
};

/**
 * Node labels for sibling relationships.
 * Uses space-separated lowercase format to match how formatRelationLabel()
 * in store.ts transforms relation types (e.g., 'halfBrother' -> 'half brother').
 */
const SIBLING_LABELS = [
  'brother',
  'sister',
  'half brother',
  'half sister',
] as const;

/**
 * Analyzes nodes and edges to determine what relationship options should be available.
 *
 * @param nodes - Array of family tree nodes
 * @param edges - Optional map of edges (for detecting multiple partners)
 * @param parentIds - Optional object with fatherId and motherId to check for parent partners
 * @returns Flags indicating which relationship types are available
 */
export function getRelationFlags(
  nodes: FamilyTreeNodeType[],
  edges?: Map<string, Edge>,
  parentIds?: { fatherId?: string; motherId?: string },
  grandparentIds?: {
    maternalGrandmotherId?: string;
    maternalGrandfatherId?: string;
    paternalGrandmotherId?: string;
    paternalGrandfatherId?: string;
  },
): RelationFlags {
  const hasAuntOrUncle = nodes.some((n) => /\b(aunt|uncle)\b/i.test(n.label));
  const hasSiblings = nodes.some((n) =>
    SIBLING_LABELS.includes(n.label as (typeof SIBLING_LABELS)[number]),
  );
  const hasChildren = nodes.some((n) => ['son', 'daughter'].includes(n.label));

  // Count partners for a given node
  const getPartnerCount = (nodeId: string | undefined): number => {
    if (!nodeId || !edges) return 0;
    let count = 0;
    for (const edge of edges.values()) {
      if (edge.relationship === 'partner') {
        if (edge.source === nodeId || edge.target === nodeId) {
          count++;
        }
      }
    }
    return count;
  };

  // Check if Father or Mother has multiple partners (more than one partner edge)
  let hasParentWithMultiplePartners = false;
  if (edges && parentIds) {
    const { fatherId, motherId } = parentIds;
    hasParentWithMultiplePartners =
      getPartnerCount(fatherId) > 1 || getPartnerCount(motherId) > 1;
  }

  // Check if any grandparent has multiple partners
  let hasGrandparentWithMultiplePartners = false;
  if (edges && grandparentIds) {
    const {
      maternalGrandmotherId,
      maternalGrandfatherId,
      paternalGrandmotherId,
      paternalGrandfatherId,
    } = grandparentIds;
    hasGrandparentWithMultiplePartners =
      getPartnerCount(maternalGrandmotherId) > 1 ||
      getPartnerCount(maternalGrandfatherId) > 1 ||
      getPartnerCount(paternalGrandmotherId) > 1 ||
      getPartnerCount(paternalGrandfatherId) > 1;
  }

  return {
    hasAuntOrUncle,
    hasSiblings,
    hasChildren,
    hasParentWithMultiplePartners,
    hasGrandparentWithMultiplePartners,
  };
}

/**
 * Builds the list of relationship options based on flags.
 *
 * @param flags - Flags from getRelationFlags
 * @returns Array of relationship options
 */
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
    { label: 'Additional Partner', value: 'additionalPartner' },
  ];

  // Half-sibling options only appear when a parent has multiple partners
  // Users must create an additional partner first before adding half-siblings
  if (flags.hasParentWithMultiplePartners) {
    opts.push(
      { label: 'Half Sister', value: 'halfSister' },
      { label: 'Half Brother', value: 'halfBrother' },
    );
  }

  // Half-aunt/uncle options only appear when a grandparent has multiple partners
  if (flags.hasGrandparentWithMultiplePartners) {
    opts.push(
      { label: 'Half Aunt', value: 'halfAunt' },
      { label: 'Half Uncle', value: 'halfUncle' },
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
