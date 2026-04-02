import { describe, expect, it } from 'vitest';
import {
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getDisplayLabel } from '~/lib/pedigree-layout/utils/getDisplayLabel';

const variableConfig: VariableConfig = {
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'rel',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGest',
};

function makeNodes(
  entries: [string, { name?: string; isEgo?: boolean }][],
): Map<string, NodeData> {
  return new Map(
    entries.map(([id, { name, isEgo }]) => [
      id,
      {
        isEgo: isEgo ?? false,
        attributes: {
          ...(name !== undefined ? { name } : {}),
        },
      },
    ]),
  );
}

function makeEdges(
  entries: [string, Omit<StoreEdge, 'isActive'> & { isActive?: boolean }][],
): Map<string, StoreEdge> {
  return new Map(
    entries.map(([id, edge]) => [
      id,
      { ...edge, isActive: edge.isActive ?? true } as StoreEdge,
    ]),
  );
}

describe('getDisplayLabel', () => {
  it('returns stored name when present', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['dad', { name: 'Rob' }],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'dad', target: 'ego', relationshipType: 'biological' }],
    ]);

    expect(getDisplayLabel('dad', 'ego', nodes, edges, variableConfig)).toBe(
      'Rob',
    );
  });

  it('labels unnamed parent as "Parent"', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['dad', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'dad', target: 'ego', relationshipType: 'biological' }],
    ]);

    expect(getDisplayLabel('dad', 'ego', nodes, edges, variableConfig)).toBe(
      'Parent',
    );
  });

  it('labels unnamed social parent as "Social Parent"', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['step', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'step', target: 'ego', relationshipType: 'social' }],
    ]);

    expect(getDisplayLabel('step', 'ego', nodes, edges, variableConfig)).toBe(
      'Social Parent',
    );
  });

  it('labels unnamed donor', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['donor', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'donor', target: 'ego', relationshipType: 'donor' }],
    ]);

    expect(getDisplayLabel('donor', 'ego', nodes, edges, variableConfig)).toBe(
      'Donor',
    );
  });

  it('labels unnamed surrogate', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['surr', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'surr', target: 'ego', relationshipType: 'surrogate' }],
    ]);

    expect(getDisplayLabel('surr', 'ego', nodes, edges, variableConfig)).toBe(
      'Surrogate',
    );
  });

  it('labels unnamed child as "Child"', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['kid', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'ego', target: 'kid', relationshipType: 'biological' }],
    ]);

    expect(getDisplayLabel('kid', 'ego', nodes, edges, variableConfig)).toBe(
      'Child',
    );
  });

  it('labels unnamed partner as "Partner"', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['p', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'ego', target: 'p', relationshipType: 'partner' }],
    ]);

    expect(getDisplayLabel('p', 'ego', nodes, edges, variableConfig)).toBe(
      'Partner',
    );
  });

  it('labels unnamed sibling as "Sibling"', () => {
    const nodes = makeNodes([
      ['ego', { name: 'Me', isEgo: true }],
      ['dad', { name: 'Rob' }],
      ['sib', {}],
    ]);
    const edges = makeEdges([
      ['e1', { source: 'dad', target: 'ego', relationshipType: 'biological' }],
      ['e2', { source: 'dad', target: 'sib', relationshipType: 'biological' }],
    ]);

    expect(getDisplayLabel('sib', 'ego', nodes, edges, variableConfig)).toBe(
      'Sibling',
    );
  });

  describe('multi-hop relationships', () => {
    it('labels unnamed grandparent with named intermediary as "{name}\'s Parent"', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', { name: 'Rob' }],
        ['grandpa', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'grandpa', target: 'dad', relationshipType: 'biological' },
        ],
      ]);

      expect(
        getDisplayLabel('grandpa', 'ego', nodes, edges, variableConfig),
      ).toBe("Rob's Parent");
    });

    it('labels unnamed grandparent without named intermediary', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', {}],
        ['grandpa', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'grandpa', target: 'dad', relationshipType: 'biological' },
        ],
      ]);

      expect(
        getDisplayLabel('grandpa', 'ego', nodes, edges, variableConfig),
      ).toBe('Grandparent');
    });

    it('labels step-parent as "{parent}\'s Partner"', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', { name: 'Rob' }],
        ['stepmom', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'dad', target: 'stepmom', relationshipType: 'partner' },
        ],
      ]);

      expect(
        getDisplayLabel('stepmom', 'ego', nodes, edges, variableConfig),
      ).toBe("Rob's Partner");
    });

    it('labels aunt/uncle with named intermediary', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', { name: 'Rob' }],
        ['grandpa', { name: 'Bill' }],
        ['uncle', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'grandpa', target: 'dad', relationshipType: 'biological' },
        ],
        [
          'e3',
          {
            source: 'grandpa',
            target: 'uncle',
            relationshipType: 'biological',
          },
        ],
      ]);

      expect(
        getDisplayLabel('uncle', 'ego', nodes, edges, variableConfig),
      ).toBe("Bill's Child");
    });

    it('labels aunt/uncle without named intermediary', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', {}],
        ['grandpa', {}],
        ['uncle', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'grandpa', target: 'dad', relationshipType: 'biological' },
        ],
        [
          'e3',
          {
            source: 'grandpa',
            target: 'uncle',
            relationshipType: 'biological',
          },
        ],
      ]);

      expect(
        getDisplayLabel('uncle', 'ego', nodes, edges, variableConfig),
      ).toBe('Aunt/Uncle');
    });

    it('labels cousin with named aunt/uncle', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', { name: 'Rob' }],
        ['grandpa', { name: 'Bill' }],
        ['uncle', { name: 'Steve' }],
        ['cousin', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'grandpa', target: 'dad', relationshipType: 'biological' },
        ],
        [
          'e3',
          {
            source: 'grandpa',
            target: 'uncle',
            relationshipType: 'biological',
          },
        ],
        [
          'e4',
          { source: 'uncle', target: 'cousin', relationshipType: 'biological' },
        ],
      ]);

      expect(
        getDisplayLabel('cousin', 'ego', nodes, edges, variableConfig),
      ).toBe("Steve's Child");
    });

    it('labels niece/nephew with named sibling', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['dad', { name: 'Rob' }],
        ['sis', { name: 'Emma' }],
        ['niece', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'dad', target: 'ego', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'dad', target: 'sis', relationshipType: 'biological' },
        ],
        [
          'e3',
          { source: 'sis', target: 'niece', relationshipType: 'biological' },
        ],
      ]);

      expect(
        getDisplayLabel('niece', 'ego', nodes, edges, variableConfig),
      ).toBe("Emma's Child");
    });

    it('labels child-in-law with named child', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['kid', { name: 'Jake' }],
        ['inlaw', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'ego', target: 'kid', relationshipType: 'biological' },
        ],
        ['e2', { source: 'kid', target: 'inlaw', relationshipType: 'partner' }],
      ]);

      expect(
        getDisplayLabel('inlaw', 'ego', nodes, edges, variableConfig),
      ).toBe("Jake's Partner");
    });

    it('labels grandchild with named child', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['kid', { name: 'Jake' }],
        ['grandkid', {}],
      ]);
      const edges = makeEdges([
        [
          'e1',
          { source: 'ego', target: 'kid', relationshipType: 'biological' },
        ],
        [
          'e2',
          { source: 'kid', target: 'grandkid', relationshipType: 'biological' },
        ],
      ]);

      expect(
        getDisplayLabel('grandkid', 'ego', nodes, edges, variableConfig),
      ).toBe("Jake's Child");
    });

    it('returns "Family Member" for unreachable nodes', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['stranger', {}],
      ]);
      const edges = makeEdges([]);

      expect(
        getDisplayLabel('stranger', 'ego', nodes, edges, variableConfig),
      ).toBe('Family Member');
    });

    it('returns "Family Member" for unclassifiable paths', () => {
      const nodes = makeNodes([
        ['ego', { name: 'Me', isEgo: true }],
        ['a', {}],
        ['b', {}],
        ['c', {}],
        ['d', {}],
        ['e', {}],
      ]);
      const edges = makeEdges([
        ['e1', { source: 'a', target: 'ego', relationshipType: 'biological' }],
        ['e2', { source: 'b', target: 'a', relationshipType: 'biological' }],
        ['e3', { source: 'c', target: 'b', relationshipType: 'biological' }],
        ['e4', { source: 'd', target: 'c', relationshipType: 'biological' }],
        ['e5', { source: 'd', target: 'e', relationshipType: 'biological' }],
      ]);

      expect(getDisplayLabel('e', 'ego', nodes, edges, variableConfig)).toBe(
        'Family Member',
      );
    });
  });
});
