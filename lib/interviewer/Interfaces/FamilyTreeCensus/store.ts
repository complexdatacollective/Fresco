import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';

enableMapSet();

export type Sex = 'male' | 'female';

export type NodeData = {
  label: string;
  sex?: Sex;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
};

export type StoreEdge = {
  source: string;
  target: string;
} & (
  | { type: 'parent'; edgeType: ParentEdgeType }
  | { type: 'partner'; current: boolean }
);

type FamilyTreeState = {
  step: 'scaffolding' | 'diseaseNomination';
  network: {
    nodes: Map<string, NodeData>;
    edges: Map<string, StoreEdge>;
  };
};

type NetworkActions = {
  addNode: (node: NodeData & { id?: string }) => string;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: StoreEdge & { id?: string }) => string;
  removeEdge: (id: string) => void;
  clearNetwork: () => void;
  setStep: (step: FamilyTreeState['step']) => void;
};

export type FamilyTreeStore = FamilyTreeState & NetworkActions;

export const createFamilyTreeStore = (
  initialNodes: Map<string, NodeData>,
  initialEdges: Map<string, StoreEdge>,
  _dispatch?: unknown,
) => {
  return createStore<FamilyTreeStore>()(
    immer((set, get) => {
      return {
        step: 'scaffolding',
        network: {
          nodes: initialNodes,
          edges: initialEdges,
        },

        setStep: (step) =>
          set((state) => {
            state.step = step;
          }),

        addNode: (node) => {
          const { id, ...data } = node;
          const nodeId = id ?? crypto.randomUUID();

          set((state) => {
            state.network.nodes.set(nodeId, data);
          });

          return nodeId;
        },

        updateNode: (id, updates) => {
          set((state) => {
            const node = state.network.nodes.get(id);
            if (node) {
              Object.assign(node, updates);
            }
          });
        },

        removeNode: (id) => {
          set((state) => {
            state.network.nodes.delete(id);

            const edgesToRemove: string[] = [];
            state.network.edges.forEach((edge, edgeId) => {
              if (edge.source === id || edge.target === id) {
                edgesToRemove.push(edgeId);
              }
            });
            edgesToRemove.forEach((edgeId) =>
              state.network.edges.delete(edgeId),
            );
          });
        },

        addEdge: (edge) => {
          const { id, ...data } = edge;
          const edgeId = id ?? crypto.randomUUID();

          set((state) => {
            state.network.edges.set(edgeId, data);
          });

          return edgeId;
        },

        removeEdge: (id) => {
          set((state) => {
            state.network.edges.delete(id);
          });
        },

        clearNetwork: () => {
          set((state) => {
            state.network.nodes.clear();
            state.network.edges.clear();
          });
        },
      };
    }),
  );
};

export type FamilyTreeStoreApi = ReturnType<typeof createFamilyTreeStore>;
