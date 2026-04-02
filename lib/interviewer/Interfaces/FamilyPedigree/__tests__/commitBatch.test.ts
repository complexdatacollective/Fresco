import { describe, expect, it } from 'vitest';
import {
  createFamilyPedigreeStore,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'name',
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
      new Map(),
      variableConfig,
    );

    store.getState().commitBatch({
      nodes: [
        {
          tempId: 'ego',
          data: {
            attributes: { name: '', [variableConfig.egoVariable]: true },
          },
        },
        {
          tempId: 'mum',
          data: {
            attributes: {
              name: 'Linda',
              [variableConfig.egoVariable]: false,
            },
          },
        },
        {
          tempId: 'dad',
          data: {
            attributes: {
              name: 'Robert',
              [variableConfig.egoVariable]: false,
            },
          },
        },
      ],
      edges: [
        {
          source: 'mum',
          target: 'ego',
          data: {
            attributes: {
              [variableConfig.relationshipTypeVariable]: 'biological',
              [variableConfig.isActiveVariable]: true,
              [variableConfig.isGestationalCarrierVariable]: true,
            },
          },
        },
        {
          source: 'dad',
          target: 'ego',
          data: {
            attributes: {
              [variableConfig.relationshipTypeVariable]: 'biological',
              [variableConfig.isActiveVariable]: true,
            },
          },
        },
      ],
    });

    const nodes = store.getState().network.nodes;
    const edges = store.getState().network.edges;

    expect(nodes.size).toBe(3);
    expect(edges.size).toBe(2);

    let egoId: string | null = null;
    for (const [id, node] of nodes) {
      if (node.attributes[variableConfig.egoVariable] === true) {
        egoId = id;
        break;
      }
    }
    expect(egoId).not.toBeNull();

    const parentIds: string[] = [];
    for (const edge of edges.values()) {
      const relType = edge.attributes[variableConfig.relationshipTypeVariable];
      if (edge.to === egoId && relType !== 'partner' && relType !== 'social') {
        parentIds.push(edge.from);
      }
    }
    expect(parentIds).toHaveLength(2);

    const parentNames = parentIds.map((id) => nodes.get(id)?.attributes.name);
    expect(parentNames).toContain('Linda');
    expect(parentNames).toContain('Robert');
  });
});
