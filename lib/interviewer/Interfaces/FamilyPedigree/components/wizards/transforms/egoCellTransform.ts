import {
  type CommitBatch,
  type NodeData,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const KNOWN_BIO_PARENT_KEYS = new Set([
  'is-donor',
  'name-known',
  'name',
  'sex-at-birth',
  'gestationalCarrier',
]);

const KNOWN_ADDITIONAL_PARENT_KEYS = new Set(['role', 'name', 'sex-at-birth']);

const KNOWN_PERSON_KEYS = new Set(['name', 'sex-at-birth']);

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

type ParentEntry = {
  tempId: string;
  nodeData: NodeData;
  relationshipType: 'biological' | 'donor' | 'surrogate' | 'social';
  isGestationalCarrier: boolean;
};

function buildBioParent(
  key: string,
  parent: Record<string, unknown>,
  donorType: 'donor' | 'surrogate',
  variableConfig: VariableConfig,
): ParentEntry {
  const nameKnown = Boolean(parent['name-known']);
  const isDonor = parent['is-donor'] === true;
  const name = nameKnown ? ((parent.name as string | undefined) ?? '') : '';
  const extraAttrs = extractUnknownAttributes(parent, KNOWN_BIO_PARENT_KEYS);

  return {
    tempId: key,
    nodeData: {
      isEgo: false,
      attributes: {
        [variableConfig.nodeLabelVariable]: name,
        [variableConfig.biologicalSexVariable]: parent['sex-at-birth'],
        ...extraAttrs,
      },
    },
    relationshipType: isDonor ? donorType : 'biological',
    isGestationalCarrier: false,
  };
}

function buildAdditionalParent(
  index: number,
  parent: Record<string, unknown>,
  variableConfig: VariableConfig,
): ParentEntry {
  const extraAttrs = extractUnknownAttributes(
    parent,
    KNOWN_ADDITIONAL_PARENT_KEYS,
  );

  return {
    tempId: `additional-parent-${String(index)}`,
    nodeData: {
      isEgo: false,
      attributes: {
        [variableConfig.nodeLabelVariable]:
          (parent.name as string | undefined) ?? '',
        [variableConfig.biologicalSexVariable]: parent['sex-at-birth'],
        ...extraAttrs,
      },
    },
    relationshipType: 'social',
    isGestationalCarrier: false,
  };
}

export type EgoCellResult = {
  batch: CommitBatch;
  egoAdoptionStatus?: 'in';
  egoAttributes?: Record<string, unknown>;
};

export function egoCellTransform(
  values: Record<string, unknown>,
  variableConfig: VariableConfig,
  existingEgoId?: string,
): EgoCellResult {
  const eggParent = values['egg-parent'] as Record<string, unknown> | undefined;
  const spermParent = values['sperm-parent'] as
    | Record<string, unknown>
    | undefined;
  const gestCarrier = values['gestational-carrier'] as
    | Record<string, unknown>
    | undefined;

  const parents: ParentEntry[] = [];

  if (eggParent) {
    const entry = buildBioParent(
      'egg-parent',
      eggParent,
      'donor',
      variableConfig,
    );
    if (eggParent.gestationalCarrier === true) {
      entry.isGestationalCarrier = true;
    }
    parents.push(entry);
  }

  if (spermParent) {
    parents.push(
      buildBioParent('sperm-parent', spermParent, 'donor', variableConfig),
    );
  }

  const hasGestCarrier = eggParent?.gestationalCarrier === false && gestCarrier;
  if (hasGestCarrier) {
    const entry = buildBioParent(
      'gestational-carrier',
      gestCarrier,
      'surrogate',
      variableConfig,
    );
    entry.isGestationalCarrier = true;
    parents.push(entry);
  }

  const additionalParents = values['additional-parent'] as
    | Record<string, unknown>[]
    | undefined;
  if (values.hasOtherParents === true && Array.isArray(additionalParents)) {
    for (let i = 0; i < additionalParents.length; i++) {
      const ap = additionalParents[i];
      if (ap) {
        parents.push(buildAdditionalParent(i, ap, variableConfig));
      }
    }
  }

  const hasAdoptiveParent = Array.isArray(additionalParents)
    ? additionalParents.some((ap) => ap?.role === 'adoptive-parent')
    : false;

  const egoRef = existingEgoId ?? 'ego';
  const batch: CommitBatch = { nodes: [], edges: [] };

  const egoSex = values['ego-sex-at-birth'] as string | undefined;

  const egoKnownKeys = new Set([
    'ego-sex-at-birth',
    'egg-parent',
    'sperm-parent',
    'gestational-carrier',
    'hasOtherParents',
    'otherParentCount',
    'additional-parent',
    'hasPartner',
    'partner',
    'childrenWithPartnerCount',
    'childWithPartner',
  ]);
  const egoCustomAttrs: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(values)) {
    if (
      !egoKnownKeys.has(key) &&
      !key.startsWith('partnership-') &&
      val !== undefined
    ) {
      egoCustomAttrs[key] = val;
    }
  }

  const egoAttributes: Record<string, unknown> = {
    [variableConfig.nodeLabelVariable]: '',
    [variableConfig.egoVariable]: true,
    ...(egoSex ? { [variableConfig.biologicalSexVariable]: egoSex } : {}),
    ...egoCustomAttrs,
  };

  if (!existingEgoId) {
    batch.nodes.push({
      tempId: 'ego',
      data: {
        isEgo: true,
        ...(hasAdoptiveParent ? { adoptionStatus: 'in' as const } : {}),
        attributes: egoAttributes,
      },
    });
  }

  for (const parent of parents) {
    batch.nodes.push({ tempId: parent.tempId, data: parent.nodeData });

    const edgeData: CommitBatch['edges'][number]['data'] = {
      relationshipType: parent.relationshipType,
      isActive: true,
      ...(parent.isGestationalCarrier ? { isGestationalCarrier: true } : {}),
    };

    batch.edges.push({
      source: parent.tempId,
      target: egoRef,
      data: edgeData,
    });
  }

  // Parse partnership fields (partnership-{id1}-{id2})
  const parentTempIds = parents.map((p) => p.tempId);
  for (let i = 0; i < parentTempIds.length; i++) {
    for (let j = i + 1; j < parentTempIds.length; j++) {
      const key = `partnership-${parentTempIds[i]}-${parentTempIds[j]}`;
      const val = values[key] as string | undefined;
      if (val === 'current' || val === 'ex') {
        batch.edges.push({
          source: parentTempIds[i]!,
          target: parentTempIds[j]!,
          data: {
            relationshipType: 'partner',
            isActive: val === 'current',
          },
        });
      }
    }
  }

  // Partner
  const hasPartner = values.hasPartner === true;
  const partnerObj = values.partner as Record<string, unknown> | undefined;

  if (hasPartner && partnerObj) {
    const partnerNameKnown = partnerObj['name-known'] !== false;
    const partnerName = partnerNameKnown
      ? ((partnerObj.name as string | undefined) ?? '')
      : '';
    const partnerExtraAttrs = extractUnknownAttributes(
      partnerObj,
      KNOWN_BIO_PARENT_KEYS,
    );

    batch.nodes.push({
      tempId: 'partner',
      data: {
        isEgo: false,
        attributes: {
          [variableConfig.nodeLabelVariable]: partnerName,
          [variableConfig.biologicalSexVariable]: partnerObj['sex-at-birth'],
          ...partnerExtraAttrs,
        },
      },
    });

    batch.edges.push({
      source: egoRef,
      target: 'partner',
      data: { relationshipType: 'partner', isActive: true },
    });
  }

  // Children with partner
  const childrenCount = hasPartner
    ? Number(values.childrenWithPartnerCount ?? 0)
    : 0;
  const childrenArray = values.childWithPartner as
    | Record<string, unknown>[]
    | undefined;

  for (let i = 0; i < childrenCount; i++) {
    const child = childrenArray?.[i];
    if (!child) continue;

    const childName = (child.name as string | undefined) ?? '';
    const childExtraAttrs = extractUnknownAttributes(child, KNOWN_PERSON_KEYS);
    const tempId = `child-${String(i)}`;

    batch.nodes.push({
      tempId,
      data: {
        isEgo: false,
        attributes: {
          [variableConfig.nodeLabelVariable]: childName,
          [variableConfig.biologicalSexVariable]: child['sex-at-birth'],
          ...childExtraAttrs,
        },
      },
    });

    batch.edges.push({
      source: egoRef,
      target: tempId,
      data: { relationshipType: 'biological', isActive: true },
    });

    if (hasPartner) {
      batch.edges.push({
        source: 'partner',
        target: tempId,
        data: { relationshipType: 'biological', isActive: true },
      });
    }
  }

  return {
    batch,
    ...(hasAdoptiveParent ? { egoAdoptionStatus: 'in' as const } : {}),
    ...(existingEgoId ? { egoAttributes } : {}),
  };
}
