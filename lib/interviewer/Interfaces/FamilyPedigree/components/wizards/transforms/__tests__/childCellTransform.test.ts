/* eslint-disable */
// @ts-nocheck -- TODO: Update tests for NcNode/NcEdge migration (Task 10)
import { describe, expect, it } from 'vitest';
import {
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { childCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/childCellTransform';

const variableConfig: VariableConfig = {
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationship',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGC',
};

const egoId = 'ego-1';
const partnerId = 'partner-1';

function makeNodes(extras?: [string, NodeData][]): Map<string, NodeData> {
  const map = new Map<string, NodeData>([
    [
      egoId,
      {
        isEgo: true,
        attributes: { name: 'Ego' },
      },
    ],
    [
      partnerId,
      {
        isEgo: false,
        attributes: { name: 'Partner' },
      },
    ],
  ]);
  if (extras) {
    for (const [id, data] of extras) {
      map.set(id, data);
    }
  }
  return map;
}

function makeEdges(extras?: [string, StoreEdge][]): Map<string, StoreEdge> {
  const map = new Map<string, StoreEdge>([
    [
      'partner-edge',
      {
        source: egoId,
        target: partnerId,
        relationshipType: 'partner',
        isActive: true,
      },
    ],
  ]);
  if (extras) {
    for (const [id, data] of extras) {
      map.set(id, data);
    }
  }
  return map;
}

describe('childCellTransform', () => {
  it('creates child with both existing bio parents', () => {
    const values: Record<string, unknown> = {
      'child': { name: 'Baby' },
      'egg-source': egoId,
      'sperm-source': partnerId,
      'egg-parent-carried': true,
    };

    const batch = childCellTransform(
      values,
      egoId,
      makeNodes(),
      makeEdges(),
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(1);
    expect(batch.nodes[0]).toMatchObject({
      tempId: 'child',
      data: {
        isEgo: false,
        attributes: { name: 'Baby' },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) => e.target === 'child' && e.data.relationshipType !== 'partner',
    );
    expect(parentEdges).toHaveLength(3);

    const eggEdge = parentEdges.find((e) => e.source === egoId);
    expect(eggEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });

    const spermEdge = parentEdges.find((e) => e.source === partnerId);
    expect(spermEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });

    const gcEdge = parentEdges.find(
      (e) =>
        e.source === egoId &&
        e.data.relationshipType !== 'partner' &&
        'isGestationalCarrier' in e.data,
    );
    expect(gcEdge?.data).toMatchObject({ isGestationalCarrier: true });
  });

  it('creates child with donor parent', () => {
    const values: Record<string, unknown> = {
      'child': { name: 'Baby' },
      'egg-source': egoId,
      'sperm-source': 'new',
      'new-sperm-source': {
        name: 'Donor Dan',
      },
      'sperm-source-is-donor': true,
      'egg-parent-carried': true,
    };

    const batch = childCellTransform(
      values,
      egoId,
      makeNodes(),
      makeEdges(),
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(2);
    expect(batch.nodes[0]).toMatchObject({ tempId: 'child' });
    expect(batch.nodes[1]).toMatchObject({
      tempId: 'new-sperm-source',
      data: {
        isEgo: false,
        attributes: { name: 'Donor Dan' },
      },
    });

    const donorEdge = batch.edges.find((e) => e.source === 'new-sperm-source');
    expect(donorEdge?.data).toMatchObject({
      relationshipType: 'donor',
      isActive: true,
    });
  });

  it('creates child with unnamed other parent', () => {
    const values: Record<string, unknown> = {
      'child': { name: 'Baby' },
      'egg-source': egoId,
      'sperm-source': 'new',
      'new-sperm-source': { name: '' },
      'egg-parent-carried': true,
    };

    const batch = childCellTransform(
      values,
      egoId,
      makeNodes(),
      makeEdges(),
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(2);
    expect(batch.nodes[1]).toMatchObject({
      tempId: 'new-sperm-source',
      data: {
        isEgo: false,
        attributes: { name: '' },
      },
    });

    const newParentEdge = batch.edges.find(
      (e) => e.source === 'new-sperm-source',
    );
    expect(newParentEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });
  });

  it('creates child with new surrogate carrier', () => {
    const values: Record<string, unknown> = {
      'child': { name: 'Baby' },
      'egg-source': egoId,
      'sperm-source': partnerId,
      'egg-parent-carried': false,
      'carrier-source': 'new',
      'new-carrier': {
        'name-known': true,
        'name': 'Surrogate Sue',
      },
      'carrier-is-surrogate': true,
    };

    const batch = childCellTransform(
      values,
      egoId,
      makeNodes(),
      makeEdges(),
      variableConfig,
    );

    const surrogateNode = batch.nodes.find((n) => n.tempId === 'new-carrier');
    expect(surrogateNode?.data.attributes).toMatchObject({
      name: 'Surrogate Sue',
    });

    const surrogateEdge = batch.edges.find((e) => e.source === 'new-carrier');
    expect(surrogateEdge?.data).toMatchObject({
      relationshipType: 'surrogate',
      isActive: true,
      isGestationalCarrier: true,
    });
  });

  it('carrier same as egg source does not duplicate node', () => {
    const values: Record<string, unknown> = {
      'child': { name: 'Baby' },
      'egg-source': egoId,
      'sperm-source': partnerId,
      'egg-parent-carried': true,
    };

    const batch = childCellTransform(
      values,
      egoId,
      makeNodes(),
      makeEdges(),
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(1);

    const egoEdges = batch.edges.filter((e) => e.source === egoId);
    expect(egoEdges).toHaveLength(2);

    const gcEdge = egoEdges.find(
      (e) =>
        e.data.relationshipType !== 'partner' &&
        'isGestationalCarrier' in e.data &&
        e.data.isGestationalCarrier === true,
    );
    expect(gcEdge).toBeDefined();

    const bioEdge = egoEdges.find(
      (e) =>
        e.data.relationshipType !== 'partner' &&
        !('isGestationalCarrier' in e.data),
    );
    expect(bioEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });
  });
});
