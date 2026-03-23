import { describe, expect, it } from 'vitest';
import { computeBioRelatives } from '~/lib/pedigree-layout/computeBioRelatives';
import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

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
      {
        source: 'mom',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'dad',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('mom')).toBe(true);
    expect(result.has('dad')).toBe(true);
  });

  it('excludes social parents', () => {
    const edges = buildEdges([
      {
        source: 'stepdad',
        target: 'ego',
        relationshipType: 'social',
        isActive: true,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('stepdad')).toBe(false);
  });

  it('includes donors', () => {
    const edges = buildEdges([
      {
        source: 'donor',
        target: 'ego',
        relationshipType: 'donor',
        isActive: true,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('donor')).toBe(true);
  });

  it('excludes surrogates', () => {
    const edges = buildEdges([
      {
        source: 'surrogate',
        target: 'ego',
        relationshipType: 'surrogate',
        isActive: true,
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
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'dad',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('grandpa')).toBe(true);
  });

  it('includes biological siblings', () => {
    const edges = buildEdges([
      {
        source: 'mom',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mom',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
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
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'stepmom',
        target: 'stepsibling',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('stepsibling')).toBe(false);
  });
});
