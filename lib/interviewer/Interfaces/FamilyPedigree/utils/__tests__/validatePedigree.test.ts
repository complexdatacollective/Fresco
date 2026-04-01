import { describe, expect, it } from 'vitest';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { validatePedigreeCompleteness } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/validatePedigree';

const LABEL_VAR = 'name';

function makeNodes(
  entries: [string, { isEgo?: boolean; name?: string }][],
): Map<string, NodeData> {
  const map = new Map<string, NodeData>();
  for (const [id, { isEgo, name }] of entries) {
    map.set(id, {
      isEgo: isEgo ?? false,
      attributes: { [LABEL_VAR]: name ?? '' },
    });
  }
  return map;
}

function makeEdges(
  entries: [string, string, StoreEdge['relationshipType']][],
): Map<string, StoreEdge> {
  const map = new Map<string, StoreEdge>();
  for (const [source, target, type] of entries) {
    const id = `${source}->${target}`;
    if (type === 'partner') {
      map.set(id, {
        source,
        target,
        relationshipType: 'partner',
        isActive: true,
      });
    } else {
      map.set(id, { source, target, relationshipType: type, isActive: true });
    }
  }
  return map;
}

describe('validatePedigreeCompleteness', () => {
  it('passes for a complete 3-generation pedigree', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['dad', { name: 'Dad' }],
      ['gm1', { name: 'Grandma 1' }],
      ['gp1', { name: 'Grandpa 1' }],
      ['gm2', { name: 'Grandma 2' }],
      ['gp2', { name: 'Grandpa 2' }],
    ]);

    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['dad', 'ego', 'biological'],
      ['gm1', 'mum', 'biological'],
      ['gp1', 'mum', 'biological'],
      ['gm2', 'dad', 'biological'],
      ['gp2', 'dad', 'biological'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues).toHaveLength(0);
  });

  it('flags ego missing biological parents', () => {
    const nodes = makeNodes([['ego', { isEgo: true }]]);
    const edges = makeEdges([]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('You');
  });

  it('flags ego with only one biological parent', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
    ]);
    const edges = makeEdges([['mum', 'ego', 'biological']]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues.some((i) => i.nodeId === 'ego')).toBe(true);
  });

  it('flags parents missing grandparents', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['dad', { name: 'Dad' }],
    ]);
    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['dad', 'ego', 'biological'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues).toHaveLength(2);
    expect(issues[0]?.message).toContain('Mum');
    expect(issues[1]?.message).toContain('Dad');
  });

  it('counts donor edges as biological parents', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['donor', { name: 'Donor' }],
      ['gm1', {}],
      ['gp1', {}],
      ['gm2', {}],
      ['gp2', {}],
    ]);
    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['donor', 'ego', 'donor'],
      ['gm1', 'mum', 'biological'],
      ['gp1', 'mum', 'biological'],
      ['gm2', 'donor', 'biological'],
      ['gp2', 'donor', 'biological'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues).toHaveLength(0);
  });

  it('does not count social edges as biological parents', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['step', { name: 'Step-dad' }],
    ]);
    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['step', 'ego', 'social'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues.some((i) => i.nodeId === 'ego')).toBe(true);
  });

  it('does not count partner edges as biological parents', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['dad', { name: 'Dad' }],
    ]);
    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['dad', 'ego', 'partner'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues.some((i) => i.nodeId === 'ego')).toBe(true);
  });

  it('skips grandparent requirement for unnamed parents', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['donor', {}],
    ]);
    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['donor', 'ego', 'donor'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.nodeId).toBe('mum');
  });

  it('passes when all named parents have grandparents and unnamed are skipped', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
      ['donor', {}],
      ['gm1', {}],
      ['gp1', {}],
    ]);
    const edges = makeEdges([
      ['mum', 'ego', 'biological'],
      ['donor', 'ego', 'donor'],
      ['gm1', 'mum', 'biological'],
      ['gp1', 'mum', 'biological'],
    ]);

    const issues = validatePedigreeCompleteness(nodes, edges, LABEL_VAR);
    expect(issues).toHaveLength(0);
  });
});
