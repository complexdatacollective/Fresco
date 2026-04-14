import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { type VariableOption } from '~/lib/codebook';
import { groupNodesByVariable } from '~/lib/interviewer/Interfaces/Narrative/ConvexHullLayer';

function makeNode(
  id: string,
  attributes: Record<string, VariableValue> = {},
): NcNode {
  return {
    [entityPrimaryKeyProperty]: id,
    [entityAttributesProperty]: attributes,
    type: 'person',
    promptIDs: [],
    stageId: '',
  };
}

const OPTIONS: VariableOption[] = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
];

describe('groupNodesByVariable', () => {
  it('returns an empty map when given an empty nodes array', () => {
    const result = groupNodesByVariable([], 'color', OPTIONS);
    expect(result.size).toBe(0);
  });

  it('correctly groups nodes by a single string value', () => {
    const nodes = [
      makeNode('node-1', { color: 'red' }),
      makeNode('node-2', { color: 'red' }),
      makeNode('node-3', { color: 'blue' }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(2);

    const groupRed = result.get('red');
    expect(groupRed).toBeDefined();
    expect(groupRed!.nodeIds).toContain('node-1');
    expect(groupRed!.nodeIds).toContain('node-2');
    expect(groupRed!.nodeIds).toHaveLength(2);

    const groupBlue = result.get('blue');
    expect(groupBlue).toBeDefined();
    expect(groupBlue!.nodeIds).toContain('node-3');
    expect(groupBlue!.nodeIds).toHaveLength(1);
  });

  it('places a node with an array of values into multiple groups', () => {
    const nodes = [makeNode('node-multi', { color: ['red', 'blue'] })];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(2);
    expect(result.get('red')!.nodeIds).toContain('node-multi');
    expect(result.get('blue')!.nodeIds).toContain('node-multi');
  });

  it('excludes nodes that do not have the group variable', () => {
    const nodes = [
      makeNode('node-with', { color: 'red' }),
      makeNode('node-without', { size: 10 }),
      makeNode('node-null', { color: null }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(1);
    const group = result.get('red')!;
    expect(group.nodeIds).toContain('node-with');
    expect(group.nodeIds).not.toContain('node-without');
    expect(group.nodeIds).not.toContain('node-null');
  });

  it('handles numeric scalar values', () => {
    const numericOptions: VariableOption[] = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ];
    const nodes = [
      makeNode('node-1', { color: 1 }),
      makeNode('node-2', { color: 2 }),
    ];

    const result = groupNodesByVariable(nodes, 'color', numericOptions);

    expect(result.size).toBe(2);
    expect(result.get(1)!.nodeIds).toContain('node-1');
    expect(result.get(2)!.nodeIds).toContain('node-2');
  });

  it('maps colorIndex as 1-based position from categoricalOptions', () => {
    const nodes = [
      makeNode('node-a', { color: 'red' }),
      makeNode('node-b', { color: 'blue' }),
      makeNode('node-c', { color: 'green' }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.get('red')!.colorIndex).toBe(1);
    expect(result.get('blue')!.colorIndex).toBe(2);
    expect(result.get('green')!.colorIndex).toBe(3);
  });

  it('falls back to colorIndex 1 when the value is not found in categoricalOptions', () => {
    const nodes = [makeNode('node-unknown', { color: 'purple' })];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.get('purple')!.colorIndex).toBe(1);
  });

  it('handles array of numeric values (from CheckboxGroup forms)', () => {
    const numericOptions: VariableOption[] = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
      { value: 3, label: 'Three' },
    ];
    const nodes = [
      makeNode('node-a', { color: [1] }),
      makeNode('node-b', { color: [1, 2] }),
      makeNode('node-c', { color: [3] }),
    ];

    const result = groupNodesByVariable(nodes, 'color', numericOptions);

    expect(result.size).toBe(3);
    expect(result.get(1)!.nodeIds).toEqual(['node-a', 'node-b']);
    expect(result.get(2)!.nodeIds).toEqual(['node-b']);
    expect(result.get(3)!.nodeIds).toEqual(['node-c']);
  });

  it('handles array of string values (from CheckboxGroup forms)', () => {
    const nodes = [
      makeNode('node-a', { color: ['red', 'blue'] }),
      makeNode('node-b', { color: ['blue'] }),
    ];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(2);
    expect(result.get('red')!.nodeIds).toEqual(['node-a']);
    expect(result.get('blue')!.nodeIds).toEqual(['node-a', 'node-b']);
  });

  it('handles nodes where the group variable is an empty array', () => {
    const nodes = [makeNode('node-empty', { color: [] })];

    const result = groupNodesByVariable(nodes, 'color', OPTIONS);

    expect(result.size).toBe(0);
  });
});
