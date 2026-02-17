import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { groupNodesByVariable } from '~/lib/interviewer/Interfaces/Narrative/ConvexHullLayer';

type CategoricalOption = { value: number; label: string };

function makeNode(
  id: string,
  attributes: Record<string, unknown> = {},
): NcNode {
  return {
    [entityPrimaryKeyProperty]: id,
    [entityAttributesProperty]: attributes,
    type: 'person',
    promptIDs: [],
    stageId: '',
  };
}

const OPTIONS: CategoricalOption[] = [
  { value: 1, label: 'Red' },
  { value: 2, label: 'Blue' },
  { value: 3, label: 'Green' },
];

describe('groupNodesByVariable', () => {
  it('returns an empty map when given an empty nodes array', () => {
    const result = groupNodesByVariable([], 'color', OPTIONS);
    expect(result.size).toBe(0);
  });

  it('correctly groups nodes by their categorical attribute value', () => {
    const nodes = [
      makeNode('node-1', { color: [1] }),
      makeNode('node-2', { color: [1] }),
      makeNode('node-3', { color: [2] }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(2);

    const group1 = result.get(1);
    expect(group1).toBeDefined();
    expect(group1!.nodeIds).toContain('node-1');
    expect(group1!.nodeIds).toContain('node-2');
    expect(group1!.nodeIds).toHaveLength(2);

    const group2 = result.get(2);
    expect(group2).toBeDefined();
    expect(group2!.nodeIds).toContain('node-3');
    expect(group2!.nodeIds).toHaveLength(1);
  });

  it('places a node with multiple categorical values into multiple groups', () => {
    const nodes = [makeNode('node-multi', { color: [1, 2] })];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(2);
    expect(result.get(1)!.nodeIds).toContain('node-multi');
    expect(result.get(2)!.nodeIds).toContain('node-multi');
  });

  it('excludes nodes that do not have the group variable', () => {
    const nodes = [
      makeNode('node-with', { color: [1] }),
      makeNode('node-without', { size: [10] }),
      makeNode('node-null', { color: null }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(1);
    const group = result.get(1)!;
    expect(group.nodeIds).toContain('node-with');
    expect(group.nodeIds).not.toContain('node-without');
    expect(group.nodeIds).not.toContain('node-null');
  });

  it('excludes nodes whose group variable is not an array (scalar values)', () => {
    const nodes = [
      makeNode('node-scalar', { color: 1 }),
      makeNode('node-string', { color: 'red' }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(0);
  });

  it('maps colorIndex as 1-based position from categoricalOptions', () => {
    const nodes = [
      makeNode('node-a', { color: [1] }),
      makeNode('node-b', { color: [2] }),
      makeNode('node-c', { color: [3] }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    // Option at index 0 (value=1) → colorIndex 1
    expect(result.get(1)!.colorIndex).toBe(1);
    // Option at index 1 (value=2) → colorIndex 2
    expect(result.get(2)!.colorIndex).toBe(2);
    // Option at index 2 (value=3) → colorIndex 3
    expect(result.get(3)!.colorIndex).toBe(3);
  });

  it('falls back to colorIndex 1 when the value is not found in categoricalOptions', () => {
    const nodes = [makeNode('node-unknown', { color: [99] })];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.get(99)!.colorIndex).toBe(1);
  });

  it('handles nodes where the group variable is an empty array', () => {
    const nodes = [makeNode('node-empty', { color: [] })];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(0);
  });
});
