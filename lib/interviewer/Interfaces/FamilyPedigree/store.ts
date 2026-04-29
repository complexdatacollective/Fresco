import {
  type NcEdge,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  addEdge as addEdgeToNetwork,
  addNode as addNodeToNetwork,
  deleteNode,
  updateStageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
import { type useAppDispatch } from '~/lib/interviewer/store';
import { computeAllDisplayLabels } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/utils/getDisplayLabel';

enableMapSet();

export type VariableConfig = {
  nodeType: string;
  edgeType: string;
  nodeLabelVariable: string;
  egoVariable: string;
  relationshipTypeVariable: string;
  isActiveVariable: string;
  isGestationalCarrierVariable: string;
};

export type NodeMetadata = {
  readOnly: boolean;
};

export type CommitBatch = {
  nodes: {
    tempId: string;
    data: {
      attributes: Record<string, VariableValue>;
    };
  }[];
  edges: {
    source: string;
    target: string;
    data: {
      attributes: Record<string, VariableValue>;
    };
  }[];
};

type FamilyPedigreeState = {
  step: 'scaffolding' | 'diseaseNomination';
  activeNominationVariable: string | null;
  network: {
    nodes: Map<string, NcNode>;
    edges: Map<string, NcEdge>;
  };
  nodeMetadata: Map<string, NodeMetadata>;
  storeToReduxIdMap: Map<string, string>;
};

type NetworkActions = {
  addNode: (node: {
    attributes: Record<string, VariableValue>;
    id?: string;
  }) => string;
  updateNode: (id: string, attributes: Record<string, VariableValue>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: {
    from: string;
    to: string;
    attributes: Record<string, VariableValue>;
    id?: string;
  }) => string;
  removeEdge: (id: string) => void;
  clearNetwork: () => void;
  setStep: (step: FamilyPedigreeState['step']) => void;
  setActiveNominationVariable: (variable: string | null) => void;
  commitBatch: (batch: CommitBatch) => void;
  syncMetadata: () => void;
  finalizeNetwork: () => Promise<void>;
  resetNetwork: () => void;
};

export type FamilyPedigreeStore = FamilyPedigreeState & NetworkActions;

export const createFamilyPedigreeStore = (
  initialNodes: Map<string, NcNode>,
  initialEdges: Map<string, NcEdge>,
  initialNodeMetadata: Map<string, NodeMetadata>,
  variableConfig: VariableConfig,
  dispatch?: ReturnType<typeof useAppDispatch>,
) => {
  return createStore<FamilyPedigreeStore>()(
    immer((set, get) => {
      return {
        step: 'scaffolding',
        activeNominationVariable: null,
        network: {
          nodes: initialNodes,
          edges: initialEdges,
        },
        nodeMetadata: initialNodeMetadata,
        storeToReduxIdMap: new Map<string, string>(),

        setStep: (step) =>
          set((state) => {
            state.step = step;
          }),

        setActiveNominationVariable: (variable) =>
          set((state) => {
            state.activeNominationVariable = variable;
          }),

        addNode: (node) => {
          const { id, attributes } = node;
          const nodeId = id ?? crypto.randomUUID();
          const isEgo = attributes[variableConfig.egoVariable] === true;

          set((state) => {
            state.network.nodes.set(nodeId, {
              _uid: nodeId,
              type: variableConfig.nodeType,
              attributes,
            });
            state.nodeMetadata.set(nodeId, { readOnly: isEgo });
          });

          return nodeId;
        },

        updateNode: (id, attributes) => {
          set((state) => {
            const node = state.network.nodes.get(id);
            if (node) {
              Object.assign(node.attributes, attributes);
            }
          });
        },

        removeNode: (id) => {
          set((state) => {
            state.network.nodes.delete(id);
            state.nodeMetadata.delete(id);

            const edgesToRemove: string[] = [];
            state.network.edges.forEach((edge, edgeId) => {
              if (edge.from === id || edge.to === id) {
                edgesToRemove.push(edgeId);
              }
            });
            edgesToRemove.forEach((edgeId) =>
              state.network.edges.delete(edgeId),
            );
          });
        },

        addEdge: (edge) => {
          const { id, from, to, attributes } = edge;
          const edgeId = id ?? crypto.randomUUID();

          set((state) => {
            state.network.edges.set(edgeId, {
              _uid: edgeId,
              type: variableConfig.edgeType,
              from,
              to,
              attributes,
            });
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
            state.nodeMetadata.clear();
          });
        },

        commitBatch: (batch) => {
          set((state) => {
            const tempIdToRealId = new Map<string, string>();

            for (const { tempId, data } of batch.nodes) {
              const realId = crypto.randomUUID();
              tempIdToRealId.set(tempId, realId);
              const isEgo =
                data.attributes[variableConfig.egoVariable] === true;
              state.network.nodes.set(realId, {
                _uid: realId,
                type: variableConfig.nodeType,
                attributes: data.attributes,
              });
              state.nodeMetadata.set(realId, { readOnly: isEgo });
            }

            for (const edge of batch.edges) {
              const resolvedSource =
                tempIdToRealId.get(edge.source) ?? edge.source;
              const resolvedTarget =
                tempIdToRealId.get(edge.target) ?? edge.target;
              const edgeId = crypto.randomUUID();
              state.network.edges.set(edgeId, {
                _uid: edgeId,
                type: variableConfig.edgeType,
                from: resolvedSource,
                to: resolvedTarget,
                attributes: edge.data.attributes,
              });
            }
          });
        },

        syncMetadata: () => {
          const { nodes, edges } = get().network;

          const egoEntry = [...nodes.entries()].find(
            ([, n]) => n.attributes[variableConfig.egoVariable] === true,
          );
          const egoId = egoEntry?.[0];

          const computedLabels = egoId
            ? computeAllDisplayLabels(egoId, nodes, edges, variableConfig)
            : new Map<string, string>();

          const serializedNodes = [...nodes.entries()].map(([id, node]) => {
            const isEgo = node.attributes[variableConfig.egoVariable] === true;
            let label =
              (node.attributes[variableConfig.nodeLabelVariable] as string) ??
              '';

            if (!label && !isEgo) {
              label = computedLabels.get(id) ?? 'Family Member';
            }

            return {
              id,
              label,
              isEgo,
            };
          });

          const serializedEdges = [...edges.entries()].map(([id, edge]) => ({
            id,
            from: edge.from,
            to: edge.to,
            attributes: edge.attributes,
          }));

          dispatch?.(
            updateStageMetadata({
              isNetworkCommitted: true,
              nodes: serializedNodes,
              edges: serializedEdges,
            }),
          );
        },

        finalizeNetwork: async () => {
          if (!dispatch) return;

          const { network, syncMetadata: sync } = get();
          const idMap = new Map<string, string>();

          for (const [storeId, node] of network.nodes) {
            const reduxId = crypto.randomUUID();
            const result = await dispatch(
              addNodeToNetwork({
                type: variableConfig.nodeType,
                attributeData: { ...node.attributes },
                modelData: { _uid: reduxId },
                allowUnknownAttributes: true,
              }),
            );

            if (addNodeToNetwork.fulfilled.match(result)) {
              idMap.set(storeId, reduxId);
            }
          }

          for (const [, edge] of network.edges) {
            const mappedFrom = idMap.get(edge.from);
            const mappedTo = idMap.get(edge.to);
            if (mappedFrom && mappedTo) {
              await dispatch(
                addEdgeToNetwork({
                  type: variableConfig.edgeType,
                  from: mappedFrom,
                  to: mappedTo,
                  attributeData: { ...edge.attributes },
                }),
              );
            }
          }

          set((state) => {
            state.storeToReduxIdMap = new Map(idMap);
            for (const key of state.nodeMetadata.keys()) {
              const meta = state.nodeMetadata.get(key);
              if (meta) {
                meta.readOnly = true;
              }
            }
          });

          sync();
        },

        resetNetwork: () => {
          const { storeToReduxIdMap } = get();

          for (const reduxId of storeToReduxIdMap.values()) {
            dispatch?.(deleteNode(reduxId));
          }

          set((state) => {
            state.network.nodes.clear();
            state.network.edges.clear();
            state.nodeMetadata.clear();
            state.storeToReduxIdMap.clear();
            state.step = 'scaffolding';
            state.activeNominationVariable = null;
          });

          dispatch?.(updateStageMetadata({ isNetworkCommitted: false }));
        },
      };
    }),
  );
};

export type FamilyPedigreeStoreApi = ReturnType<
  typeof createFamilyPedigreeStore
>;
