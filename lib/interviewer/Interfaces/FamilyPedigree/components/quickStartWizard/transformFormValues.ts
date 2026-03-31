import { type ParentEdge } from '~/schemas/familyPedigree';
import {
  type ParentDetail,
  type ParentPartnership,
  type PersonDetail,
  type QuickStartData,
  type SiblingDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const KNOWN_BIO_PARENT_KEYS = new Set([
  'is-donor',
  'name-known',
  'name',
  'sex-at-birth',
  'gestationalCarrier',
  'raised-by',
]);

const KNOWN_ADDITIONAL_PARENT_KEYS = new Set(['role', 'name', 'sex-at-birth']);

const KNOWN_PERSON_KEYS = new Set(['name-known', 'name', 'sex-at-birth']);

function extractUnknownAttributes(
  obj: Record<string, unknown>,
  knownKeys: Set<string>,
): Record<string, unknown> | undefined {
  const attrs: Record<string, unknown> = {};
  let hasAttrs = false;
  for (const [key, val] of Object.entries(obj)) {
    if (!knownKeys.has(key) && val !== undefined) {
      attrs[key] = val;
      hasAttrs = true;
    }
  }
  return hasAttrs ? attrs : undefined;
}

function bioParentEdgeType(
  parent: Record<string, unknown>,
  fallback: ParentEdge['relationshipType'],
): ParentEdge['relationshipType'] {
  if (parent['is-donor'] === true) return fallback;
  return 'biological';
}

function bioParentToParentDetail(
  parent: Record<string, unknown>,
  donorEdgeType: ParentEdge['relationshipType'],
): ParentDetail {
  const nameKnown = Boolean(parent['name-known']);
  return {
    name: nameKnown ? ((parent.name as string | undefined) ?? '') : '',
    biologicalSex: parent['sex-at-birth'] as string | undefined,
    nameKnown,
    edgeType: bioParentEdgeType(parent, donorEdgeType),
    attributes: extractUnknownAttributes(parent, KNOWN_BIO_PARENT_KEYS),
  };
}

function additionalParentToParentDetail(
  parent: Record<string, unknown>,
): ParentDetail {
  return {
    name: (parent.name as string | undefined) ?? '',
    biologicalSex: parent['sex-at-birth'] as string | undefined,
    nameKnown: true,
    edgeType: 'social',
    attributes: extractUnknownAttributes(parent, KNOWN_ADDITIONAL_PARENT_KEYS),
  };
}

function nestedPersonDetail(
  obj: Record<string, unknown> | undefined,
): PersonDetail {
  if (!obj) return { name: '' };
  return {
    name: (obj.name as string | undefined) ?? '',
    biologicalSex: obj['sex-at-birth'] as string | undefined,
    attributes: extractUnknownAttributes(obj, KNOWN_PERSON_KEYS),
  };
}

export function transformFormValues(
  values: Record<string, unknown>,
): QuickStartData {
  // --- Build unified parents array ---
  // Order: egg-parent, sperm-parent, [gestational-carrier], additional-parent[0..N]
  const eggParent = values['egg-parent'] as Record<string, unknown> | undefined;
  const spermParent = values['sperm-parent'] as
    | Record<string, unknown>
    | undefined;
  const gestCarrier = values['gestational-carrier'] as
    | Record<string, unknown>
    | undefined;

  const parentIds: string[] = [];
  const parents: ParentDetail[] = [];

  if (eggParent) {
    parents.push(bioParentToParentDetail(eggParent, 'donor'));
    parentIds.push('egg-parent');
  }
  if (spermParent) {
    parents.push(bioParentToParentDetail(spermParent, 'donor'));
    parentIds.push('sperm-parent');
  }

  const hasGestCarrier = eggParent?.gestationalCarrier === false && gestCarrier;
  if (hasGestCarrier) {
    parents.push(bioParentToParentDetail(gestCarrier, 'surrogate'));
    parentIds.push('gestational-carrier');
  }

  const additionalParents = values['additional-parent'] as
    | Record<string, unknown>[]
    | undefined;
  if (values.hasOtherParents === true && Array.isArray(additionalParents)) {
    for (let i = 0; i < additionalParents.length; i++) {
      const ap = additionalParents[i];
      if (ap) {
        parents.push(additionalParentToParentDetail(ap));
        parentIds.push(`additional-parent-${String(i)}`);
      }
    }
  }

  const parentCount = parents.length;

  // --- Gestational carrier parent index ---
  let gestationalCarrierParentIndex: number | undefined;
  if (eggParent?.gestationalCarrier === true) {
    gestationalCarrierParentIndex = parentIds.indexOf('egg-parent');
  } else if (hasGestCarrier) {
    gestationalCarrierParentIndex = parentIds.indexOf('gestational-carrier');
  }

  // --- Parent partnerships ---
  const idToIndex = new Map(parentIds.map((id, i) => [id, i]));
  const parentPartnerships: ParentPartnership[] = [];

  for (let i = 0; i < parentIds.length; i++) {
    for (let j = i + 1; j < parentIds.length; j++) {
      const key = `partnership-${parentIds[i]}-${parentIds[j]}`;
      const val = values[key] as string | undefined;
      if (val === 'current') {
        parentPartnerships.push({ parentIndices: [i, j], isActive: true });
      } else if (val === 'ex') {
        parentPartnerships.push({ parentIndices: [i, j], isActive: false });
      }
    }
  }

  // --- Ego parent indices ---
  const rawEgoParents = values['ego-parents'];
  const egoParentIndices =
    parentCount >= 3 && Array.isArray(rawEgoParents)
      ? rawEgoParents.map((v) => Number(v))
      : undefined;

  // --- Siblings ---
  const siblingCount = Number(values.siblingCount ?? 0);
  const siblingArray = values.sibling as Record<string, unknown>[] | undefined;

  const siblings: SiblingDetail[] = Array.from(
    { length: siblingCount },
    (_, i) => {
      const sib = siblingArray?.[i];
      const rawShared = sib?.sharedParents;
      const sharedParentIndices = Array.isArray(rawShared)
        ? rawShared.map((v) => Number(v))
        : [];
      return {
        name: (sib?.name as string | undefined) ?? '',
        biologicalSex: sib?.['sex-at-birth'] as string | undefined,
        sharedParentIndices,
        attributes: sib
          ? extractUnknownAttributes(sib, KNOWN_PERSON_KEYS)
          : undefined,
      };
    },
  );

  // --- Partner ---
  const hasPartner = values.hasPartner === true;
  const partnerObj = values.partner as Record<string, unknown> | undefined;
  const partner: QuickStartData['partner'] = hasPartner
    ? { hasPartner: true, ...nestedPersonDetail(partnerObj) }
    : { hasPartner: false };

  // --- Children with partner ---
  const childrenWithPartnerCount = Number(values.noChildrenWithPartner ?? 0);
  const childWithPartnerArray = values.childWithPartner as
    | Record<string, unknown>[]
    | undefined;
  const childrenWithPartner: PersonDetail[] = hasPartner
    ? Array.from({ length: childrenWithPartnerCount }, (_, i) =>
        nestedPersonDetail(childWithPartnerArray?.[i]),
      )
    : [];

  // --- Other children ---
  const otherChildrenCount = Number(values.noChildrenWithOther ?? 0);
  const otherChildArray = values.otherChild as
    | Record<string, unknown>[]
    | undefined;
  const otherChildren: PersonDetail[] = Array.from(
    { length: otherChildrenCount },
    (_, i) => nestedPersonDetail(otherChildArray?.[i]),
  );

  // --- Half-sibling other parents ---
  const effectiveEgoParents =
    egoParentIndices ?? Array.from({ length: parentCount }, (_, i) => i);
  const egoSet = new Set(effectiveEgoParents);
  const halfSiblingOtherParents: QuickStartData['halfSiblingOtherParents'] = [];

  for (let i = 0; i < siblingCount; i++) {
    const sibling = siblings[i]!;
    const sharedSet = new Set(sibling.sharedParentIndices);
    const isStrictSubset =
      sharedSet.size < egoSet.size &&
      [...sharedSet].every((idx) => egoSet.has(idx));
    if (isStrictSubset) {
      const hspObj = (
        values.halfSibParent as Record<string, unknown>[] | undefined
      )?.[i];
      const nameKnown = Boolean(hspObj?.['name-known']);
      halfSiblingOtherParents.push({
        name: nameKnown ? ((hspObj?.name as string | undefined) ?? '') : '',
        biologicalSex: hspObj?.['sex-at-birth'] as string | undefined,
        nameKnown,
        siblingIndex: i,
        sharedParentIndices: sibling.sharedParentIndices,
        attributes: hspObj
          ? extractUnknownAttributes(hspObj, KNOWN_PERSON_KEYS)
          : undefined,
      });
    }
  }

  return {
    adoptionStatus: undefined,
    bioParents: [],
    parents,
    parentPartnerships,
    gestationalCarrierParentIndex,
    egoParentIndices,
    siblings,
    partner,
    childrenWithPartner,
    otherChildren,
    halfSiblingOtherParents,
    parentBranches: [],
    siblingFamilies: [],
  };
}
