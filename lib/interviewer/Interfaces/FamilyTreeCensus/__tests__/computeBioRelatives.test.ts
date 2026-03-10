import { describe, expect, it } from 'vitest';
import { computeBioRelatives } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/computeBioRelatives';
import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

function buildEdges(defs: StoreEdge[]): Map<string, StoreEdge> {
  const edges = new Map<string, StoreEdge>();
  defs.forEach((e, i) => edges.set(`e${i}`, e));
  return edges;
}

describe('computeBioRelatives', () => {
  it('includes ego', () => {
    const result = computeBioRelatives('ego', new Map());
    expect(result.has('ego')).toBe(true);
  });

  it('includes biological parents', () => {
    const edges = buildEdges([
      { source: 'mom', target: 'ego', type: 'parent', edgeType: 'parent' },
      { source: 'dad', target: 'ego', type: 'parent', edgeType: 'parent' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('mom')).toBe(true);
    expect(result.has('dad')).toBe(true);
  });

  it('excludes non-biological parents', () => {
    const edges = buildEdges([
      {
        source: 'stepdad',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: false,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('stepdad')).toBe(false);
  });

  it('includes donors', () => {
    const edges = buildEdges([
      { source: 'donor', target: 'ego', type: 'parent', edgeType: 'donor' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('donor')).toBe(true);
  });

  it('excludes surrogates', () => {
    const edges = buildEdges([
      {
        source: 'surrogate',
        target: 'ego',
        type: 'parent',
        edgeType: 'surrogate',
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('surrogate')).toBe(false);
  });

  it('traverses multi-generational chains', () => {
    const edges = buildEdges([
      {
        source: 'grandpa',
        target: 'dad',
        type: 'parent',
        edgeType: 'parent',
      },
      { source: 'dad', target: 'ego', type: 'parent', edgeType: 'parent' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('grandpa')).toBe(true);
  });

  it('includes biological siblings', () => {
    const edges = buildEdges([
      { source: 'mom', target: 'ego', type: 'parent', edgeType: 'parent' },
      {
        source: 'mom',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('sibling')).toBe(true);
  });

  it('excludes non-biological siblings', () => {
    const edges = buildEdges([
      {
        source: 'stepmom',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: false,
      },
      {
        source: 'stepmom',
        target: 'stepsibling',
        type: 'parent',
        edgeType: 'parent',
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('stepsibling')).toBe(false);
  });
});
