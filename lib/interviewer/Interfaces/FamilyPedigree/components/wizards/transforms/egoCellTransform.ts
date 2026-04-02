import { type VariableValue } from '@codaco/shared-consts';
import {
  type CommitBatch,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const KNOWN_BIO_PARENT_KEYS = new Set([
  'is-donor',
  'name',
  'gestationalCarrier',
]);

const KNOWN_ADDITIONAL_PARENT_KEYS = new Set(['role', 'name']);

const KNOWN_PERSON_KEYS = new Set(['name']);

function extractUnknownAttributes(
  obj: Record<string, unknown>,
  knownKeys: Set<string>,
): Record<string, VariableValue> | undefined {
  const attrs: Record<string, VariableValue> = {};
  let hasAttrs = false;
  for (const [key, val] of Object.entries(obj)) {
    if (!knownKeys.has(key) && val !== undefined) {
      attrs[key] = val as VariableValue;
      hasAttrs = true;
    }
  }
  return hasAttrs ? attrs : undefined;
}

type ParentEntry = {
  tempId: string;
  attributes: Record<string, VariableValue>;
  relationshipType:
    | 'biological'
    | 'donor'
    | 'surrogate'
    | 'social'
    | 'adoptive';
  isGestationalCarrier: boolean;
};

function buildBioParent(
  key: string,
  parent: Record<string, unknown>,
  donorType: 'donor' | 'surrogate',
  variableConfig: VariableConfig,
): ParentEntry {
  const isDonor = parent['is-donor'] === true;
  const name = (parent.name as string | undefined) ?? '';
  const extraAttrs = extractUnknownAttributes(parent, KNOWN_BIO_PARENT_KEYS);

  return {
    tempId: key,
    attributes: {
      [variableConfig.nodeLabelVariable]: name,
      [variableConfig.egoVariable]: false,
      ...extraAttrs,
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
    attributes: {
      [variableConfig.nodeLabelVariable]:
        (parent.name as string | undefined) ?? '',
      [variableConfig.egoVariable]: false,
      ...extraAttrs,
    },
    relationshipType: parent.role === 'adoptive-parent' ? 'adoptive' : 'social',
    isGestationalCarrier: false,
  };
}

export type EgoCellResult = {
  batch: CommitBatch;
  egoAttributes?: Record<string, VariableValue>;
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

  const egoRef = existingEgoId ?? 'ego';
  const batch: CommitBatch = { nodes: [], edges: [] };

  const egoKnownKeys = new Set([
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
  const egoCustomAttrs: Record<string, VariableValue> = {};
  for (const [key, val] of Object.entries(values)) {
    if (
      !egoKnownKeys.has(key) &&
      !key.startsWith('partnership-') &&
      val !== undefined
    ) {
      egoCustomAttrs[key] = val as VariableValue;
    }
  }

  const egoAttributes: Record<string, VariableValue> = {
    [variableConfig.nodeLabelVariable]: '',
    [variableConfig.egoVariable]: true,
    ...egoCustomAttrs,
  };

  if (!existingEgoId) {
    batch.nodes.push({
      tempId: 'ego',
      data: {
        attributes: egoAttributes,
      },
    });
  }

  for (const parent of parents) {
    batch.nodes.push({
      tempId: parent.tempId,
      data: { attributes: parent.attributes },
    });

    const edgeAttributes: Record<string, VariableValue> = {
      [variableConfig.relationshipTypeVariable]: parent.relationshipType,
      [variableConfig.isActiveVariable]: true,
    };
    if (parent.isGestationalCarrier) {
      edgeAttributes[variableConfig.isGestationalCarrierVariable] = true;
    }

    batch.edges.push({
      source: parent.tempId,
      target: egoRef,
      data: { attributes: edgeAttributes },
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
            attributes: {
              [variableConfig.relationshipTypeVariable]: 'partner',
              [variableConfig.isActiveVariable]: val === 'current',
            },
          },
        });
      }
    }
  }

  // Partner
  const hasPartner = values.hasPartner === true;
  const partnerObj = values.partner as Record<string, unknown> | undefined;

  if (hasPartner && partnerObj) {
    const partnerName = (partnerObj.name as string | undefined) ?? '';
    const partnerExtraAttrs = extractUnknownAttributes(
      partnerObj,
      KNOWN_BIO_PARENT_KEYS,
    );

    batch.nodes.push({
      tempId: 'partner',
      data: {
        attributes: {
          [variableConfig.nodeLabelVariable]: partnerName,
          [variableConfig.egoVariable]: false,
          ...partnerExtraAttrs,
        },
      },
    });

    batch.edges.push({
      source: egoRef,
      target: 'partner',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'partner',
          [variableConfig.isActiveVariable]: true,
        },
      },
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
        attributes: {
          [variableConfig.nodeLabelVariable]: childName,
          [variableConfig.egoVariable]: false,
          ...childExtraAttrs,
        },
      },
    });

    batch.edges.push({
      source: egoRef,
      target: tempId,
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'biological',
          [variableConfig.isActiveVariable]: true,
        },
      },
    });

    if (hasPartner) {
      batch.edges.push({
        source: 'partner',
        target: tempId,
        data: {
          attributes: {
            [variableConfig.relationshipTypeVariable]: 'biological',
            [variableConfig.isActiveVariable]: true,
          },
        },
      });
    }
  }

  return {
    batch,
    ...(existingEgoId ? { egoAttributes } : {}),
  };
}
