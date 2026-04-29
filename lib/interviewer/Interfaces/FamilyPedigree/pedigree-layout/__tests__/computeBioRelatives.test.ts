import { type NcEdge } from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { computeBioRelatives } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/computeBioRelatives';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'relationship',
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationshipType',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGestationalCarrier',
};

function makeEdge(
  from: string,
  to: string,
  relationshipType: string,
  isActive = true,
): NcEdge {
  const uid = crypto.randomUUID();
  return {
    _uid: uid,
    type: 'relationship',
    from,
    to,
    attributes: {
      relationshipType,
      isActive,
    },
  };
}

function buildEdges(defs: NcEdge[]): Map<string, NcEdge> {
  const edges = new Map<string, NcEdge>();
  for (const e of defs) {
    edges.set(e._uid, e);
  }
  return edges;
}

describe('computeBioRelatives', () => {
  it('includes ego', () => {
    const result = computeBioRelatives('ego', new Map(), variableConfig);
    expect(result.has('ego')).toBe(true);
  });

  it('includes biological parents', () => {
    const edges = buildEdges([
      makeEdge('mom', 'ego', 'biological'),
      makeEdge('dad', 'ego', 'biological'),
    ]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('mom')).toBe(true);
    expect(result.has('dad')).toBe(true);
  });

  it('excludes social parents', () => {
    const edges = buildEdges([makeEdge('stepdad', 'ego', 'social')]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('stepdad')).toBe(false);
  });

  it('includes donors', () => {
    const edges = buildEdges([makeEdge('donor', 'ego', 'donor')]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('donor')).toBe(true);
  });

  it('excludes surrogates', () => {
    const edges = buildEdges([makeEdge('surrogate', 'ego', 'surrogate')]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('surrogate')).toBe(false);
  });

  it('traverses multi-generational chains', () => {
    const edges = buildEdges([
      makeEdge('grandpa', 'dad', 'biological'),
      makeEdge('dad', 'ego', 'biological'),
    ]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('grandpa')).toBe(true);
  });

  it('includes biological siblings', () => {
    const edges = buildEdges([
      makeEdge('mom', 'ego', 'biological'),
      makeEdge('mom', 'sibling', 'biological'),
    ]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('sibling')).toBe(true);
  });

  it('excludes non-biological siblings', () => {
    const edges = buildEdges([
      makeEdge('stepmom', 'ego', 'social'),
      makeEdge('stepmom', 'stepsibling', 'biological'),
    ]);
    const result = computeBioRelatives('ego', edges, variableConfig);
    expect(result.has('stepsibling')).toBe(false);
  });
});
