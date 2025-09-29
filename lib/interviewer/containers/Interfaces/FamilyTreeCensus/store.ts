import { invariant } from 'es-toolkit';
import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

enableMapSet();

type Gender = 'male' | 'female';

type Node = {
  id?: string;
  label: string;
  gender: Gender;
  readOnly?: boolean;
  isEgo?: boolean;
  x?: number;
  y?: number;
};

type Edge = {
  id?: string;
  source: string;
  target: string;
  relationship: string;
};

type NetworkState = {
  nodes: Map<string, Omit<Node, 'id'>>;
  edges: Map<string, Omit<Edge, 'id'>>;
};

type FamilyTreeState = {
  step: number;
  network: NetworkState;
};

type NetworkActions = {
  addNode: (node: Omit<Node, 'id'> & { id?: string }) => string;
  updateNode: (id: string, updates: Partial<Omit<Node, 'id'>>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<Edge, 'id'> & { id?: string }) => string | undefined;
  removeEdge: (id: string) => void;
  clearNetwork: () => void;
  generatePlaceholderNetwork: (formData: Record<string, number>) => void;
  getNetworkAsObject: () => { nodes: Node[]; edges: Edge[] };
  runLayout: () => void;
};

type FamilyTreeAction = {
  setStep: (step: number) => void;
} & NetworkActions;

const initialState: FamilyTreeState = {
  step: 0,
  network: {
    nodes: new Map(),
    edges: new Map(),
  },
};

const arrayFromRelationCount = (
  formData: Record<string, number>,
  relation: string,
) => Array.from({ length: formData[relation] ?? 0 });

export type FamilyTreeStore = FamilyTreeState & FamilyTreeAction;

export const createFamilyTreeStore = (init: FamilyTreeState = initialState) => {
  return createStore<FamilyTreeStore>()(
    immer((set, get) => ({
      ...init,

      setStep: (step) =>
        set((state) => {
          state.step = step;
        }),

      addNode: ({
        id = crypto.randomUUID(),
        label,
        gender,
        readOnly = false,
        isEgo = false,
        x,
        y,
      }) => {
        set((state) => {
          invariant(
            !state.network.nodes.has(id),
            `Node with ID ${id} already exists`,
          );
          state.network.nodes.set(id, { label, gender, readOnly, isEgo, x, y });
        });
        return id;
      },

      updateNode: (id, updates) =>
        set((state) => {
          const node = state.network.nodes.get(id);
          invariant(node, `Node with ID ${id} does not exist`);
          Object.assign(node, updates);
        }),

      removeNode: (id) =>
        set((state) => {
          state.network.nodes.delete(id);
          // Remove all edges connected to this node
          const edgesToRemove: string[] = [];
          state.network.edges.forEach((edge, edgeId) => {
            if (edge.source === id || edge.target === id) {
              edgesToRemove.push(edgeId);
            }
          });
          edgesToRemove.forEach((edgeId) => state.network.edges.delete(edgeId));
        }),

      addEdge: ({ id, source, target, relationship }) => {
        const edgeId = id || `${source}-${target}-${relationship}`;
        set((state) => {
          if (state.network.edges.has(edgeId)) {
            return; // Edge already exists
          }
          state.network.edges.set(edgeId, { source, target, relationship });
        });
        return edgeId;
      },

      removeEdge: (id) =>
        set((state) => {
          state.network.edges.delete(id);
        }),

      clearNetwork: () =>
        set((state) => {
          state.network.nodes.clear();
          state.network.edges.clear();
        }),

      generatePlaceholderNetwork: (formData) => {
        const store = get();

        // Clear existing network
        store.clearNetwork();

        // Use the existing addNode and addEdge actions
        const { addNode, addEdge } = store;

        // Maternal grandparents
        addNode({
          id: 'maternal-grandmother',
          label: 'maternal grandmother',
          gender: 'female',
          readOnly: true,
        });
        addNode({
          id: 'maternal-grandfather',
          label: 'maternal grandfather',
          gender: 'male',
          readOnly: true,
        });
        addEdge({
          source: 'maternal-grandfather',
          target: 'maternal-grandmother',
          relationship: 'partner',
        });

        // Paternal grandparents
        addNode({
          id: 'paternal-grandmother',
          label: 'paternal grandmother',
          gender: 'female',
          readOnly: true,
        });
        addNode({
          id: 'paternal-grandfather',
          label: 'paternal grandfather',
          gender: 'male',
          readOnly: true,
        });
        addEdge({
          source: 'paternal-grandfather',
          target: 'paternal-grandmother',
          relationship: 'partner',
        });

        // Mother
        addNode({
          id: 'mother',
          label: 'mother',
          gender: 'female',
          readOnly: true,
        });
        addEdge({
          source: 'maternal-grandfather',
          target: 'mother',
          relationship: 'parent',
        });
        addEdge({
          source: 'maternal-grandmother',
          target: 'mother',
          relationship: 'parent',
        });

        // Father
        addNode({
          id: 'father',
          label: 'father',
          gender: 'male',
          readOnly: true,
        });
        addEdge({
          source: 'paternal-grandfather',
          target: 'father',
          relationship: 'parent',
        });
        addEdge({
          source: 'paternal-grandmother',
          target: 'father',
          relationship: 'parent',
        });
        addEdge({
          source: 'father',
          target: 'mother',
          relationship: 'partner',
        });

        // Ego (self)
        addNode({
          id: 'ego',
          label: 'self',
          gender: 'female',
          readOnly: true,
          isEgo: true,
        }); // TODO: Make dynamic based on user input

        // Add siblings
        arrayFromRelationCount(formData, 'brothers').forEach(() => {
          const brotherId = addNode({
            label: 'brother',
            gender: 'male',
            readOnly: false,
          });
          addEdge({
            source: 'father',
            target: brotherId,
            relationship: 'parent',
          });
          addEdge({
            source: 'mother',
            target: brotherId,
            relationship: 'parent',
          });
        });

        arrayFromRelationCount(formData, 'sisters').forEach(() => {
          const sisterId = addNode({
            label: 'sister',
            gender: 'female',
            readOnly: false,
          });
          addEdge({
            source: 'father',
            target: sisterId,
            relationship: 'parent',
          });
          addEdge({
            source: 'mother',
            target: sisterId,
            relationship: 'parent',
          });
        });

        // Ego's children and partner
        if ((formData.sons ?? 0) > 0 || (formData.daughters ?? 0) > 0) {
          const egoPartnerId = addNode({
            id: 'ego-partner',
            label: "self's partner",
            gender: 'male', // TODO: Make dynamic based on user input
            readOnly: true,
          });
          addEdge({
            source: 'ego',
            target: egoPartnerId,
            relationship: 'partner',
          });

          arrayFromRelationCount(formData, 'sons').forEach(() => {
            const sonId = addNode({
              label: 'son',
              gender: 'male',
              readOnly: true,
            });
            addEdge({
              source: 'ego',
              target: sonId,
              relationship: 'parent',
            });
            addEdge({
              source: 'ego-partner',
              target: sonId,
              relationship: 'parent',
            });
          });

          arrayFromRelationCount(formData, 'daughters').forEach(() => {
            const daughterId = addNode({
              label: 'daughter',
              gender: 'female',
              readOnly: false,
            });
            addEdge({
              source: 'ego',
              target: daughterId,
              relationship: 'parent',
            });
            addEdge({
              source: 'ego-partner',
              target: daughterId,
              relationship: 'parent',
            });
          });
        }

        // Paternal uncles and aunts
        arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
          const uncleId = addNode({
            label: 'paternal uncle',
            gender: 'male',
            readOnly: false,
          });
          addEdge({
            source: 'paternal-grandfather',
            target: uncleId,
            relationship: 'parent',
          });
          addEdge({
            source: 'paternal-grandmother',
            target: uncleId,
            relationship: 'parent',
          });
        });

        arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
          const auntId = addNode({
            label: 'paternal aunt',
            gender: 'female',
            readOnly: false,
          });
          addEdge({
            source: 'paternal-grandfather',
            target: auntId,
            relationship: 'parent',
          });
          addEdge({
            source: 'paternal-grandmother',
            target: auntId,
            relationship: 'parent',
          });
        });

        // Maternal uncles and aunts
        arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
          const uncleId = addNode({
            label: 'maternal uncle',
            gender: 'male',
            readOnly: false,
          });
          addEdge({
            source: 'maternal-grandfather',
            target: uncleId,
            relationship: 'parent',
          });
          addEdge({
            source: 'maternal-grandmother',
            target: uncleId,
            relationship: 'parent',
          });
        });

        arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
          const auntId = addNode({
            label: 'maternal aunt',
            gender: 'female',
            readOnly: false,
          });
          addEdge({
            source: 'maternal-grandfather',
            target: auntId,
            relationship: 'parent',
          });
          addEdge({
            source: 'maternal-grandmother',
            target: auntId,
            relationship: 'parent',
          });
        });
      },

      getNetworkAsObject: () => {
        const state = get();

        return {
          nodes: Array.from(state.network.nodes.values()),
          edges: Array.from(state.network.edges.values()),
        };
      },
    })),
  );
};

export type FamilyTreeStoreApi = ReturnType<typeof createFamilyTreeStore>;
