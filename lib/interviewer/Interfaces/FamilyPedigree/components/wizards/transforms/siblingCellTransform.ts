import {
  type NcEdge,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import {
  type CommitBatch,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const KNOWN_PERSON_KEYS = new Set(['name']);

function extractCustomAttributes(
  obj: Record<string, unknown>,
): Record<string, VariableValue> | undefined {
  const attrs: Record<string, VariableValue> = {};
  let hasAttrs = false;
  for (const [key, val] of Object.entries(obj)) {
    if (!KNOWN_PERSON_KEYS.has(key) && val !== undefined) {
      attrs[key] = val as VariableValue;
      hasAttrs = true;
    }
  }
  return hasAttrs ? attrs : undefined;
}

function buildPersonAttributes(
  person: Record<string, unknown>,
  variableConfig: VariableConfig,
): Record<string, VariableValue> {
  const name = (person.name as string | undefined) ?? '';
  const extraAttrs = extractCustomAttributes(person);

  return {
    [variableConfig.nodeLabelVariable]: name,
    [variableConfig.egoVariable]: false,
    ...extraAttrs,
  };
}

type RoleKey = 'egg-source' | 'sperm-source' | 'carrier-source';

const ROLE_KEYS: RoleKey[] = ['egg-source', 'sperm-source', 'carrier-source'];

type ResolvedParent = {
  roleKey: RoleKey;
  tempId: string;
  isExisting: boolean;
};

export function siblingCellTransform(
  values: Record<string, unknown>,
  _anchorNodeId: string,
  nodes: Map<string, NcNode>,
  _edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): CommitBatch {
  const batch: CommitBatch = { nodes: [], edges: [] };

  const siblingData = values.sibling as Record<string, unknown>;
  batch.nodes.push({
    tempId: 'sibling',
    data: {
      attributes: buildPersonAttributes(siblingData, variableConfig),
    },
  });

  const resolvedParents: ResolvedParent[] = [];
  const tempIdByRole = new Map<RoleKey, string>();
  const eggParentCarried = values['egg-parent-carried'] !== false;

  const activeRoles: RoleKey[] = eggParentCarried
    ? ['egg-source', 'sperm-source']
    : ['egg-source', 'sperm-source', 'carrier-source'];

  for (const roleKey of activeRoles) {
    const selection = values[roleKey] as string | undefined;
    if (!selection) continue;

    if (nodes.has(selection)) {
      resolvedParents.push({ roleKey, tempId: selection, isExisting: true });
      tempIdByRole.set(roleKey, selection);
    } else if (selection === 'new') {
      const newPersonData = values[`new-${roleKey}`] as Record<string, unknown>;
      const tempId = `new-${roleKey}`;
      batch.nodes.push({
        tempId,
        data: {
          attributes: buildPersonAttributes(newPersonData, variableConfig),
        },
      });
      resolvedParents.push({ roleKey, tempId, isExisting: false });
      tempIdByRole.set(roleKey, tempId);
    }
  }

  if (eggParentCarried) {
    const eggTempId = tempIdByRole.get('egg-source');
    if (eggTempId) {
      const eggParent = resolvedParents.find((p) => p.roleKey === 'egg-source');
      resolvedParents.push({
        roleKey: 'carrier-source',
        tempId: eggTempId,
        isExisting: eggParent?.isExisting ?? false,
      });
      tempIdByRole.set('carrier-source', eggTempId);
    }
  }

  const carrierTempId = tempIdByRole.get('carrier-source');

  const seenEdges = new Set<string>();
  for (const parent of resolvedParents) {
    const edgeKey = `${parent.tempId}->sibling`;
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);

    let relationshipType: 'biological' | 'donor' | 'surrogate';
    const isCarrier = parent.roleKey === 'carrier-source';

    if (isCarrier) {
      relationshipType =
        values['carrier-is-surrogate'] === true ? 'surrogate' : 'biological';
    } else if (parent.roleKey === 'egg-source') {
      relationshipType =
        values['egg-source-is-donor'] === true ? 'donor' : 'biological';
    } else {
      relationshipType =
        values['sperm-source-is-donor'] === true ? 'donor' : 'biological';
    }

    const shouldMarkGC = isCarrier || parent.tempId === carrierTempId;

    const edgeAttributes: Record<string, VariableValue> = {
      [variableConfig.relationshipTypeVariable]: relationshipType,
      [variableConfig.isActiveVariable]: true,
    };
    if (shouldMarkGC) {
      edgeAttributes[variableConfig.isGestationalCarrierVariable] = true;
    }

    batch.edges.push({
      source: parent.tempId,
      target: 'sibling',
      data: { attributes: edgeAttributes },
    });
  }

  for (const key of Object.keys(values)) {
    if (!key.startsWith('partnership-')) continue;
    const val = values[key] as string | undefined;
    if (val !== 'current' && val !== 'ex') continue;

    const suffix = key.slice('partnership-'.length);
    const roleKeys = ROLE_KEYS.filter((rk) => suffix.startsWith(rk + '-'));
    if (roleKeys.length === 0) continue;

    const firstRole = roleKeys.reduce((a, b) => (a.length >= b.length ? a : b));
    const secondRolePart = suffix.slice(firstRole.length + 1);
    const secondRole = ROLE_KEYS.find((rk) => rk === secondRolePart);
    if (!secondRole) continue;

    const sourceId = tempIdByRole.get(firstRole);
    const targetId = tempIdByRole.get(secondRole);
    if (!sourceId || !targetId) continue;

    batch.edges.push({
      source: sourceId,
      target: targetId,
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'partner',
          [variableConfig.isActiveVariable]: val === 'current',
        },
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
          attributes: {
            [variableConfig.nodeLabelVariable]: apName,
            [variableConfig.egoVariable]: false,
            ...apExtraAttrs,
          },
        },
      });

      batch.edges.push({
        source: tempId,
        target: 'sibling',
        data: {
          attributes: {
            [variableConfig.relationshipTypeVariable]: 'social',
            [variableConfig.isActiveVariable]: true,
          },
        },
      });
    }
  }

  return batch;
}
