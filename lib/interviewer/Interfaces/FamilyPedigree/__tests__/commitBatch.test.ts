import { describe, expect, it } from 'vitest';
import { createFamilyPedigreeStore } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const variableConfig = {
  nodeLabelVariable: 'name',
  biologicalSexVariable: 'sex',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'rel',
  isActiveVariable: 'active',
  isGestationalCarrierVariable: 'gc',
};

describe('commitBatch', () => {
  it('creates nodes and edges with correct IDs', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      variableConfig,
    );

    store.getState().commitBatch({
      nodes: [
        { tempId: 'ego', data: { isEgo: true, attributes: { name: '' } } },
        {
          tempId: 'mum',
          data: { isEgo: false, attributes: { name: 'Linda' } },
        },
        {
          tempId: 'dad',
          data: { isEgo: false, attributes: { name: 'Robert' } },
        },
      ],
      edges: [
        {
          source: 'mum',
          target: 'ego',
          data: {
            relationshipType: 'biological',
            isActive: true,
            isGestationalCarrier: true,
          },
        },
        {
          source: 'dad',
          target: 'ego',
          data: { relationshipType: 'biological', isActive: true },
        },
      ],
    });

    const nodes = store.getState().network.nodes;
    const edges = store.getState().network.edges;

    expect(nodes.size).toBe(3);
    expect(edges.size).toBe(2);

    let egoId: string | null = null;
    for (const [id, node] of nodes) {
      if (node.isEgo) {
        egoId = id;
        break;
      }
    }
    expect(egoId).not.toBeNull();

    const parentIds: string[] = [];
    for (const edge of edges.values()) {
      if (
        edge.target === egoId &&
        edge.relationshipType !== 'partner' &&
        edge.relationshipType !== 'social'
      ) {
        parentIds.push(edge.source);
      }
    }
    expect(parentIds).toHaveLength(2);

    const parentNames = parentIds.map((id) => nodes.get(id)?.attributes.name);
    expect(parentNames).toContain('Linda');
    expect(parentNames).toContain('Robert');
  });
});
