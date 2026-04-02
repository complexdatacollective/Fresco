import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import { type useAppDispatch } from '~/lib/interviewer/store';
import { computeAllDisplayLabels } from '~/lib/pedigree-layout/utils/getDisplayLabel';

enableMapSet();

export type AdoptionStatus = 'in' | 'out' | 'by-relative';

export type VariableConfig = {
  nodeLabelVariable: string;
  egoVariable: string;
  relationshipTypeVariable: string;
  isActiveVariable: string;
  isGestationalCarrierVariable: string;
};

export type NodeData = {
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
  isBioRelative?: boolean;
  adoptionStatus?: AdoptionStatus;
  attributes: Record<string, unknown>;
};

export type StoreEdge = {
  source: string;
  target: string;
} & (
  | {
      relationshipType: 'biological' | 'social' | 'donor' | 'surrogate';
      isActive: boolean;
      isGestationalCarrier?: boolean;
    }
  | { relationshipType: 'partner'; isActive: boolean }
);

export type CommitBatchEdgeData =
  | {
      relationshipType: 'biological' | 'social' | 'donor' | 'surrogate';
      isActive: boolean;
      isGestationalCarrier?: boolean;
    }
  | { relationshipType: 'partner'; isActive: boolean };

export type CommitBatch = {
  nodes: { tempId: string; data: NodeData }[];
  edges: {
    source: string;
    target: string;
    data: CommitBatchEdgeData;
  }[];
};

type FamilyPedigreeState = {
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
  setStep: (step: FamilyPedigreeState['step']) => void;
  commitBatch: (batch: CommitBatch) => void;
  syncMetadata: () => void;
};

export type FamilyPedigreeStore = FamilyPedigreeState & NetworkActions;

export const createFamilyPedigreeStore = (
  initialNodes: Map<string, NodeData>,
  initialEdges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
  dispatch?: ReturnType<typeof useAppDispatch>,
) => {
  return createStore<FamilyPedigreeStore>()(
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

        commitBatch: (batch) => {
          set((state) => {
            const tempIdToRealId = new Map<string, string>();

            for (const { tempId, data } of batch.nodes) {
              const realId = crypto.randomUUID();
              tempIdToRealId.set(tempId, realId);
              state.network.nodes.set(realId, data);
            }

            for (const edge of batch.edges) {
              const resolvedSource =
                tempIdToRealId.get(edge.source) ?? edge.source;
              const resolvedTarget =
                tempIdToRealId.get(edge.target) ?? edge.target;
              const edgeId = crypto.randomUUID();
              state.network.edges.set(edgeId, {
                source: resolvedSource,
                target: resolvedTarget,
                ...edge.data,
              });
            }
          });
        },

        syncMetadata: () => {
          const { nodes, edges } = get().network;

          const egoEntry = [...nodes.entries()].find(([, n]) => n.isEgo);
          const egoId = egoEntry?.[0];

          const computedLabels = egoId
            ? computeAllDisplayLabels(egoId, nodes, edges, variableConfig)
            : new Map<string, string>();

          const serializedNodes = [...nodes.entries()].map(([id, node]) => {
            let label =
              (node.attributes[variableConfig.nodeLabelVariable] as string) ??
              '';

            if (!label && !node.isEgo) {
              label = computedLabels.get(id) ?? 'Family Member';
            }

            return {
              id,
              interviewNetworkId: node.interviewNetworkId,
              label,
              isEgo: node.isEgo,
              adoptionStatus: node.adoptionStatus,
            };
          });

          const serializedEdges = [...edges.entries()].map(([id, edge]) => ({
            id,
            ...edge,
          }));

          dispatch?.(
            updateStageMetadata({
              isNetworkCommitted: true,
              nodes: serializedNodes,
              edges: serializedEdges,
            }),
          );
        },
      };
    }),
  );
};

export type FamilyPedigreeStoreApi = ReturnType<
  typeof createFamilyPedigreeStore
>;
