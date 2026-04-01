import { describe, expect, it } from 'vitest';
import {
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { siblingCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/siblingCellTransform';

const variableConfig: VariableConfig = {
  nodeLabelVariable: 'name',
  biologicalSexVariable: 'sex',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationship',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGC',
};

function makeNodes(
  entries: [string, Partial<NodeData>][],
): Map<string, NodeData> {
  const map = new Map<string, NodeData>();
  for (const [id, partial] of entries) {
    map.set(id, {
      isEgo: false,
      attributes: {},
      ...partial,
    });
  }
  return map;
}

function makeEdges(entries: [string, StoreEdge][]): Map<string, StoreEdge> {
  const map = new Map<string, StoreEdge>();
  for (const [id, edge] of entries) {
    map.set(id, edge);
  }
  return map;
}

describe('siblingCellTransform', () => {
  it('creates full sibling sharing all existing parents', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, attributes: { name: 'Anchor' } }],
      [
        'parent-a',
        { isEgo: false, attributes: { name: 'Mom', sex: 'female' } },
      ],
      ['parent-b', { isEgo: false, attributes: { name: 'Dad', sex: 'male' } }],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          source: 'parent-a',
          target: 'anchor',
          relationshipType: 'biological',
          isActive: true,
          isGestationalCarrier: true,
        },
      ],
      [
        'e2',
        {
          source: 'parent-b',
          target: 'anchor',
          relationshipType: 'biological',
          isActive: true,
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Alice',
        'sex-at-birth': 'female',
      },
      'egg-source': 'parent-a',
      'sperm-source': 'parent-b',
      'egg-parent-carried': true,
    };

    const batch = siblingCellTransform(
      values,
      'anchor',
      nodes,
      edges,
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(1);
    expect(batch.nodes[0]).toMatchObject({
      tempId: 'sibling',
      data: {
        isEgo: false,
        attributes: { name: 'Alice', sex: 'female' },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) => e.target === 'sibling' && e.data.relationshipType !== 'partner',
    );
    expect(parentEdges).toHaveLength(2);

    const eggEdge = parentEdges.find((e) => e.source === 'parent-a');
    expect(eggEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
      isGestationalCarrier: true,
    });

    const spermEdge = parentEdges.find((e) => e.source === 'parent-b');
    expect(spermEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });
    expect(spermEdge?.data).not.toHaveProperty('isGestationalCarrier');
  });

  it('creates half sibling with a new sperm parent', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, attributes: { name: 'Anchor' } }],
      [
        'parent-a',
        { isEgo: false, attributes: { name: 'Mom', sex: 'female' } },
      ],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          source: 'parent-a',
          target: 'anchor',
          relationshipType: 'biological',
          isActive: true,
          isGestationalCarrier: true,
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Ben',
        'sex-at-birth': 'male',
      },
      'egg-source': 'parent-a',
      'sperm-source': 'new',
      'new-sperm-source': {
        'name-known': true,
        'name': 'Carlos',
        'sex-at-birth': 'male',
      },
      'egg-parent-carried': true,
      'partnership-egg-source-sperm-source': 'ex',
    };

    const batch = siblingCellTransform(
      values,
      'anchor',
      nodes,
      edges,
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(2);
    expect(batch.nodes[0]).toMatchObject({ tempId: 'sibling' });
    expect(batch.nodes[1]).toMatchObject({
      tempId: 'new-sperm-source',
      data: {
        isEgo: false,
        attributes: { name: 'Carlos', sex: 'male' },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) => e.target === 'sibling' && e.data.relationshipType !== 'partner',
    );
    expect(parentEdges).toHaveLength(2);

    const newSpermEdge = parentEdges.find(
      (e) => e.source === 'new-sperm-source',
    );
    expect(newSpermEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });

    const partnerships = batch.edges.filter(
      (e) => e.data.relationshipType === 'partner',
    );
    expect(partnerships).toHaveLength(1);
    expect(partnerships[0]).toMatchObject({
      source: 'parent-a',
      target: 'new-sperm-source',
      data: { relationshipType: 'partner', isActive: false },
    });
  });

  it('creates sibling with unknown sperm parent', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, attributes: { name: 'Anchor' } }],
      [
        'parent-a',
        { isEgo: false, attributes: { name: 'Mom', sex: 'female' } },
      ],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          source: 'parent-a',
          target: 'anchor',
          relationshipType: 'biological',
          isActive: true,
          isGestationalCarrier: true,
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Cara',
        'sex-at-birth': 'female',
      },
      'egg-source': 'parent-a',
      'sperm-source': 'new',
      'new-sperm-source': { 'name-known': false, 'sex-at-birth': 'male' },
      'egg-parent-carried': true,
    };

    const batch = siblingCellTransform(
      values,
      'anchor',
      nodes,
      edges,
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(2);
    expect(batch.nodes[0]).toMatchObject({ tempId: 'sibling' });

    const newParentNode = batch.nodes[1];
    expect(newParentNode).toMatchObject({
      tempId: 'new-sperm-source',
      data: {
        isEgo: false,
        attributes: { name: '', sex: 'male' },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) => e.target === 'sibling' && e.data.relationshipType !== 'partner',
    );
    expect(parentEdges).toHaveLength(2);

    const newParentEdge = parentEdges.find(
      (e) => e.source === 'new-sperm-source',
    );
    expect(newParentEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });
  });

  it('uses egg parent as carrier without creating a duplicate edge', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, attributes: { name: 'Anchor' } }],
      [
        'parent-a',
        { isEgo: false, attributes: { name: 'Mom', sex: 'female' } },
      ],
      ['parent-b', { isEgo: false, attributes: { name: 'Dad', sex: 'male' } }],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          source: 'parent-a',
          target: 'anchor',
          relationshipType: 'biological',
          isActive: true,
          isGestationalCarrier: true,
        },
      ],
      [
        'e2',
        {
          source: 'parent-b',
          target: 'anchor',
          relationshipType: 'biological',
          isActive: true,
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Diana',
        'sex-at-birth': 'female',
      },
      'egg-source': 'parent-a',
      'sperm-source': 'parent-b',
      'egg-parent-carried': true,
    };

    const batch = siblingCellTransform(
      values,
      'anchor',
      nodes,
      edges,
      variableConfig,
    );

    expect(batch.nodes).toHaveLength(1);

    const allEdgesToSibling = batch.edges.filter((e) => e.target === 'sibling');
    expect(allEdgesToSibling).toHaveLength(2);

    const eggEdge = allEdgesToSibling.find((e) => e.source === 'parent-a');
    expect(eggEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
      isGestationalCarrier: true,
    });

    const spermEdge = allEdgesToSibling.find((e) => e.source === 'parent-b');
    expect(spermEdge?.data).toMatchObject({
      relationshipType: 'biological',
      isActive: true,
    });
    expect(spermEdge?.data).not.toHaveProperty('isGestationalCarrier');

    const fromParentA = batch.edges.filter((e) => e.source === 'parent-a');
    expect(fromParentA).toHaveLength(1);
  });
});
