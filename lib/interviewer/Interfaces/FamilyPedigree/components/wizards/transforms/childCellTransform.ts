import {
  type CommitBatch,
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const KNOWN_PERSON_KEYS = new Set(['name-known', 'name', 'sex-at-birth']);

function extractCustomAttributes(
  obj: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const attrs: Record<string, unknown> = {};
  let hasAttrs = false;
  for (const [key, val] of Object.entries(obj)) {
    if (!KNOWN_PERSON_KEYS.has(key) && val !== undefined) {
      attrs[key] = val;
      hasAttrs = true;
    }
  }
  return hasAttrs ? attrs : undefined;
}

type RoleKey = 'egg-source' | 'sperm-source' | 'carrier-source';

const NEW_PERSON_NAMESPACE: Record<RoleKey, string> = {
  'egg-source': 'new-egg-source',
  'sperm-source': 'new-sperm-source',
  'carrier-source': 'new-carrier',
};

type ParentEntry = {
  tempId: string;
  nodeData: NodeData;
  relationshipType: 'biological' | 'donor' | 'surrogate';
  isGestationalCarrier: boolean;
};

function buildParentFromNew(
  roleKey: RoleKey,
  personValues: Record<string, unknown>,
  isDonor: boolean,
  isSurrogate: boolean,
  variableConfig: VariableConfig,
): ParentEntry {
  const nameKnown = Boolean(personValues['name-known']);
  const name = nameKnown
    ? ((personValues.name as string | undefined) ?? '')
    : '';
  const extraAttrs = extractCustomAttributes(personValues);

  let relationshipType: 'biological' | 'donor' | 'surrogate' = 'biological';
  if (isDonor) relationshipType = 'donor';
  if (isSurrogate) relationshipType = 'surrogate';

  return {
    tempId: NEW_PERSON_NAMESPACE[roleKey],
    nodeData: {
      isEgo: false,
      attributes: {
        [variableConfig.nodeLabelVariable]: name,
        [variableConfig.biologicalSexVariable]: personValues['sex-at-birth'],
        ...extraAttrs,
      },
    },
    relationshipType,
    isGestationalCarrier: roleKey === 'carrier-source',
  };
}

export function childCellTransform(
  values: Record<string, unknown>,
  anchorNodeId: string,
  _nodes: Map<string, NodeData>,
  _edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): CommitBatch {
  const batch: CommitBatch = { nodes: [], edges: [] };

  const childValues = values.child as Record<string, unknown> | undefined;
  const childName = (childValues?.name as string | undefined) ?? '';
  const childSex = childValues?.['sex-at-birth'];
  const childExtraAttrs = childValues
    ? extractCustomAttributes(childValues)
    : undefined;

  batch.nodes.push({
    tempId: 'child',
    data: {
      isEgo: false,
      attributes: {
        [variableConfig.nodeLabelVariable]: childName,
        [variableConfig.biologicalSexVariable]: childSex,
        ...childExtraAttrs,
      },
    },
  });

  const parentEntries: ParentEntry[] = [];
  const existingParentEdges: {
    sourceId: string;
    roleKey: RoleKey;
    relationshipType: 'biological' | 'donor' | 'surrogate';
    isGestationalCarrier: boolean;
  }[] = [];

  let resolvedEggSourceId: string | undefined;
  const eggParentCarried = values['egg-parent-carried'] !== false;

  const activeRoles: RoleKey[] = eggParentCarried
    ? ['egg-source', 'sperm-source']
    : ['egg-source', 'sperm-source', 'carrier-source'];

  for (const roleKey of activeRoles) {
    const selection = values[roleKey] as string | undefined;
    if (!selection) continue;

    const isDonor = values[`${roleKey}-is-donor`] === true;
    const isSurrogate =
      roleKey === 'carrier-source' && values['carrier-is-surrogate'] === true;

    let relationshipType: 'biological' | 'donor' | 'surrogate' = 'biological';
    if (isDonor) relationshipType = 'donor';
    if (isSurrogate) relationshipType = 'surrogate';

    if (selection === 'new') {
      const namespace = NEW_PERSON_NAMESPACE[roleKey];
      const personValues = values[namespace] as
        | Record<string, unknown>
        | undefined;
      if (personValues) {
        parentEntries.push(
          buildParentFromNew(
            roleKey,
            personValues,
            isDonor,
            isSurrogate,
            variableConfig,
          ),
        );
      }
    } else {
      if (roleKey === 'egg-source') {
        resolvedEggSourceId = selection;
      }
      existingParentEdges.push({
        sourceId: selection,
        roleKey,
        relationshipType,
        isGestationalCarrier: roleKey === 'carrier-source',
      });
    }
  }

  if (eggParentCarried) {
    if (resolvedEggSourceId) {
      existingParentEdges.push({
        sourceId: resolvedEggSourceId,
        roleKey: 'carrier-source',
        relationshipType: 'biological',
        isGestationalCarrier: true,
      });
    } else {
      const eggEntry = parentEntries.find(
        (e) => e.tempId === NEW_PERSON_NAMESPACE['egg-source'],
      );
      if (eggEntry) {
        eggEntry.isGestationalCarrier = true;
      }
    }
  }

  for (const entry of parentEntries) {
    batch.nodes.push({ tempId: entry.tempId, data: entry.nodeData });
    batch.edges.push({
      source: entry.tempId,
      target: 'child',
      data: {
        relationshipType: entry.relationshipType,
        isActive: true,
        ...(entry.isGestationalCarrier ? { isGestationalCarrier: true } : {}),
      },
    });
  }

  for (const entry of existingParentEdges) {
    batch.edges.push({
      source: entry.sourceId,
      target: 'child',
      data: {
        relationshipType: entry.relationshipType,
        isActive: true,
        ...(entry.isGestationalCarrier ? { isGestationalCarrier: true } : {}),
      },
    });
  }

  const additionalParents = values['additional-parent'] as
    | Record<string, unknown>[]
    | undefined;
  if (values.hasOtherParents === true && Array.isArray(additionalParents)) {
    for (let i = 0; i < additionalParents.length; i++) {
      const ap = additionalParents[i];
      if (!ap) continue;
      const apName = (ap.name as string | undefined) ?? '';
      const apExtraAttrs = extractCustomAttributes(ap);
      const tempId = `additional-parent-${String(i)}`;

      batch.nodes.push({
        tempId,
        data: {
          isEgo: false,
          attributes: {
            [variableConfig.nodeLabelVariable]: apName,
            [variableConfig.biologicalSexVariable]: ap['sex-at-birth'],
            ...apExtraAttrs,
          },
        },
      });

      batch.edges.push({
        source: tempId,
        target: 'child',
        data: { relationshipType: 'social', isActive: true },
      });
    }
  }

  const allTempIds = parentEntries.map((p) => p.tempId);
  const allExistingIds = existingParentEdges.map((e) => e.sourceId);
  const allParentIds = [...allTempIds, ...allExistingIds];

  for (let i = 0; i < allParentIds.length; i++) {
    for (let j = i + 1; j < allParentIds.length; j++) {
      const aKey =
        i < allTempIds.length
          ? parentEntries[i]!.tempId.replace('new-', '').replace('unknown-', '')
          : existingParentEdges[i - allTempIds.length]!.roleKey;
      const bKey =
        j < allTempIds.length
          ? parentEntries[j]!.tempId.replace('new-', '').replace('unknown-', '')
          : existingParentEdges[j - allTempIds.length]!.roleKey;

      const key = `partnership-${aKey}-${bKey}`;
      const val = values[key] as string | undefined;
      if (val === 'current' || val === 'ex') {
        batch.edges.push({
          source: allParentIds[i]!,
          target: allParentIds[j]!,
          data: {
            relationshipType: 'partner',
            isActive: val === 'current',
          },
        });
      }
    }
  }

  return batch;
}
