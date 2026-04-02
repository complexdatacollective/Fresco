import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { siblingCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/siblingCellTransform';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationship',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGC',
};

function makeNodes(
  entries: [string, { isEgo?: boolean; name?: string }][],
): Map<string, NcNode> {
  const map = new Map<string, NcNode>();
  for (const [id, { isEgo, name }] of entries) {
    map.set(id, {
      _uid: id,
      type: 'person',
      attributes: {
        [variableConfig.egoVariable]: isEgo ?? false,
        name: name ?? '',
      },
    });
  }
  return map;
}

function makeEdges(
  entries: [
    string,
    {
      from: string;
      to: string;
      relType: string;
      isActive?: boolean;
      isGC?: boolean;
    },
  ][],
): Map<string, NcEdge> {
  const map = new Map<string, NcEdge>();
  for (const [id, { from, to, relType, isActive, isGC }] of entries) {
    const attrs: Record<string, string | boolean> = {
      [variableConfig.relationshipTypeVariable]: relType,
      [variableConfig.isActiveVariable]: isActive ?? true,
    };
    if (isGC) {
      attrs[variableConfig.isGestationalCarrierVariable] = true;
    }
    map.set(id, {
      _uid: id,
      type: 'family',
      from,
      to,
      attributes: attrs,
    });
  }
  return map;
}

describe('siblingCellTransform', () => {
  it('creates full sibling sharing all existing parents', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, name: 'Anchor' }],
      ['parent-a', { isEgo: false, name: 'Mom' }],
      ['parent-b', { isEgo: false, name: 'Dad' }],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          from: 'parent-a',
          to: 'anchor',
          relType: 'biological',
          isGC: true,
        },
      ],
      [
        'e2',
        {
          from: 'parent-b',
          to: 'anchor',
          relType: 'biological',
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Alice',
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
        attributes: {
          name: 'Alice',
          [variableConfig.egoVariable]: false,
        },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) =>
        e.target === 'sibling' &&
        e.data.attributes[variableConfig.relationshipTypeVariable] !==
          'partner',
    );
    expect(parentEdges).toHaveLength(2);

    const eggEdge = parentEdges.find((e) => e.source === 'parent-a');
    expect(eggEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isActiveVariable]: true,
      [variableConfig.isGestationalCarrierVariable]: true,
    });

    const spermEdge = parentEdges.find((e) => e.source === 'parent-b');
    expect(spermEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isActiveVariable]: true,
    });
    expect(
      spermEdge?.data.attributes[variableConfig.isGestationalCarrierVariable],
    ).toBeUndefined();
  });

  it('creates half sibling with a new sperm parent', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, name: 'Anchor' }],
      ['parent-a', { isEgo: false, name: 'Mom' }],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          from: 'parent-a',
          to: 'anchor',
          relType: 'biological',
          isGC: true,
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Ben',
      },
      'egg-source': 'parent-a',
      'sperm-source': 'new',
      'new-sperm-source': {
        'name-known': true,
        'name': 'Carlos',
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
        attributes: {
          name: 'Carlos',
          [variableConfig.egoVariable]: false,
        },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) =>
        e.target === 'sibling' &&
        e.data.attributes[variableConfig.relationshipTypeVariable] !==
          'partner',
    );
    expect(parentEdges).toHaveLength(2);

    const newSpermEdge = parentEdges.find(
      (e) => e.source === 'new-sperm-source',
    );
    expect(newSpermEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isActiveVariable]: true,
    });

    const partnerships = batch.edges.filter(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
        'partner',
    );
    expect(partnerships).toHaveLength(1);
    expect(partnerships[0]).toMatchObject({
      source: 'parent-a',
      target: 'new-sperm-source',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'partner',
          [variableConfig.isActiveVariable]: false,
        },
      },
    });
  });

  it('creates sibling with unknown sperm parent', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, name: 'Anchor' }],
      ['parent-a', { isEgo: false, name: 'Mom' }],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          from: 'parent-a',
          to: 'anchor',
          relType: 'biological',
          isGC: true,
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Cara',
      },
      'egg-source': 'parent-a',
      'sperm-source': 'new',
      'new-sperm-source': { 'name-known': false },
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
        attributes: {
          name: '',
          [variableConfig.egoVariable]: false,
        },
      },
    });

    const parentEdges = batch.edges.filter(
      (e) =>
        e.target === 'sibling' &&
        e.data.attributes[variableConfig.relationshipTypeVariable] !==
          'partner',
    );
    expect(parentEdges).toHaveLength(2);

    const newParentEdge = parentEdges.find(
      (e) => e.source === 'new-sperm-source',
    );
    expect(newParentEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isActiveVariable]: true,
    });
  });

  it('uses egg parent as carrier without creating a duplicate edge', () => {
    const nodes = makeNodes([
      ['anchor', { isEgo: false, name: 'Anchor' }],
      ['parent-a', { isEgo: false, name: 'Mom' }],
      ['parent-b', { isEgo: false, name: 'Dad' }],
    ]);

    const edges = makeEdges([
      [
        'e1',
        {
          from: 'parent-a',
          to: 'anchor',
          relType: 'biological',
          isGC: true,
        },
      ],
      [
        'e2',
        {
          from: 'parent-b',
          to: 'anchor',
          relType: 'biological',
        },
      ],
    ]);

    const values: Record<string, unknown> = {
      'sibling': {
        'name-known': true,
        'name': 'Diana',
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
    expect(eggEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isActiveVariable]: true,
      [variableConfig.isGestationalCarrierVariable]: true,
    });

    const spermEdge = allEdgesToSibling.find((e) => e.source === 'parent-b');
    expect(spermEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isActiveVariable]: true,
    });
    expect(
      spermEdge?.data.attributes[variableConfig.isGestationalCarrierVariable],
    ).toBeUndefined();

    const fromParentA = batch.edges.filter((e) => e.source === 'parent-a');
    expect(fromParentA).toHaveLength(1);
  });
});
