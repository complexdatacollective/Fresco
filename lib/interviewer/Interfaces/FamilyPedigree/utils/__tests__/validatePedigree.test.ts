import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { validatePedigreeCompleteness } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/validatePedigree';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'rel',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGest',
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
        [variableConfig.nodeLabelVariable]: name ?? '',
      },
    });
  }
  return map;
}

function makeEdges(entries: [string, string, string][]): Map<string, NcEdge> {
  const map = new Map<string, NcEdge>();
  for (const [source, target, relType] of entries) {
    const id = `${source}->${target}`;
    map.set(id, {
      _uid: id,
      type: 'family',
      from: source,
      to: target,
      attributes: {
        [variableConfig.relationshipTypeVariable]: relType,
        [variableConfig.isActiveVariable]: true,
      },
    });
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
    expect(issues).toHaveLength(0);
  });

  it('flags ego missing biological parents', () => {
    const nodes = makeNodes([['ego', { isEgo: true }]]);
    const edges = makeEdges([]);

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('You');
  });

  it('flags ego with only one biological parent', () => {
    const nodes = makeNodes([
      ['ego', { isEgo: true }],
      ['mum', { name: 'Mum' }],
    ]);
    const edges = makeEdges([['mum', 'ego', 'biological']]);

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
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

    const issues = validatePedigreeCompleteness(nodes, edges, variableConfig);
    expect(issues).toHaveLength(0);
  });
});
