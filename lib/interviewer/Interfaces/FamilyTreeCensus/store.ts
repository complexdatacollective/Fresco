import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import { type useAppDispatch } from '~/lib/interviewer/store';
import {
  type Gender,
  type ParentEdgeType,
  type Sex,
} from '~/lib/pedigree-layout/types';

enableMapSet();

export type NodeData = {
  label: string;
  sex?: Sex;
  gender?: Gender;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
};

export type PersonDetail = {
  name: string;
  sex?: Sex;
  gender?: Gender;
};

export type ParentDetail = PersonDetail & {
  edgeType: ParentEdgeType;
};

export type BioParentDetail = PersonDetail & {
  nameKnown: boolean;
};

export type QuickStartData = {
  parents: ParentDetail[];
  bioParents: BioParentDetail[];
  siblings: PersonDetail[];
  partner: (PersonDetail & { hasPartner: true }) | { hasPartner: false };
  childrenWithPartner: PersonDetail[];
  otherChildren: PersonDetail[];
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
  generateQuickStartNetwork: (data: QuickStartData) => void;
  syncMetadata: () => void;
};

export type FamilyTreeStore = FamilyTreeState & NetworkActions;

export const createFamilyTreeStore = (
  initialNodes: Map<string, NodeData>,
  initialEdges: Map<string, StoreEdge>,
  dispatch?: ReturnType<typeof useAppDispatch>,
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

        generateQuickStartNetwork: (data) => {
          get().clearNetwork();

          const egoId = get().addNode({ label: '', isEgo: true });

          // Create parent nodes
          const parentIds: string[] = [];
          for (const parent of data.parents) {
            const parentId = get().addNode({
              label: parent.name,
              sex: parent.sex,
              gender: parent.gender,
              isEgo: false,
            });
            parentIds.push(parentId);
            get().addEdge({
              source: parentId,
              target: egoId,
              type: 'parent',
              edgeType: parent.edgeType,
            });
          }

          // Link consecutive parents as partners
          for (let i = 1; i < parentIds.length; i++) {
            get().addEdge({
              source: parentIds[i - 1]!,
              target: parentIds[i]!,
              type: 'partner',
              current: true,
            });
          }

          // Create bio-parent nodes
          for (const bp of data.bioParents) {
            const bpId = get().addNode({
              label: bp.nameKnown ? bp.name : '',
              sex: bp.sex,
              gender: bp.gender,
              isEgo: false,
            });
            get().addEdge({
              source: bpId,
              target: egoId,
              type: 'parent',
              edgeType: 'bio-parent',
            });
          }

          // Create siblings linked to all parents (not bio-parents)
          for (const sibling of data.siblings) {
            const siblingId = get().addNode({
              label: sibling.name,
              sex: sibling.sex,
              gender: sibling.gender,
              isEgo: false,
            });
            for (const parentId of parentIds) {
              const parentEdge = [...get().network.edges.values()].find(
                (e) =>
                  e.type === 'parent' &&
                  e.source === parentId &&
                  e.target === egoId,
              );
              if (parentEdge && parentEdge.type === 'parent') {
                get().addEdge({
                  source: parentId,
                  target: siblingId,
                  type: 'parent',
                  edgeType: parentEdge.edgeType,
                });
              }
            }
          }

          // Create partner
          let partnerId: string | undefined;
          if (data.partner.hasPartner) {
            partnerId = get().addNode({
              label: data.partner.name,
              sex: data.partner.sex,
              gender: data.partner.gender,
              isEgo: false,
            });
            get().addEdge({
              source: egoId,
              target: partnerId,
              type: 'partner',
              current: true,
            });
          }

          // Create children with partner
          for (const child of data.childrenWithPartner) {
            const childId = get().addNode({
              label: child.name,
              sex: child.sex,
              gender: child.gender,
              isEgo: false,
            });
            get().addEdge({
              source: egoId,
              target: childId,
              type: 'parent',
              edgeType: 'social-parent',
            });
            if (partnerId) {
              get().addEdge({
                source: partnerId,
                target: childId,
                type: 'parent',
                edgeType: 'social-parent',
              });
            }
          }

          // Create other children (ego only)
          for (const child of data.otherChildren) {
            const childId = get().addNode({
              label: child.name,
              sex: child.sex,
              gender: child.gender,
              isEgo: false,
            });
            get().addEdge({
              source: egoId,
              target: childId,
              type: 'parent',
              edgeType: 'social-parent',
            });
          }
        },

        syncMetadata: () => {
          const { nodes, edges } = get().network;

          const serializedNodes = [...nodes.entries()].map(([id, node]) => ({
            id,
            interviewNetworkId: node.interviewNetworkId,
            label: node.label,
            sex: node.sex,
            gender: node.gender,
            isEgo: node.isEgo,
          }));

          const serializedEdges = [...edges.entries()].map(([id, edge]) => ({
            id,
            ...edge,
          }));

          dispatch?.(
            updateStageMetadata({
              hasCompletedQuickStart: true,
              nodes: serializedNodes,
              edges: serializedEdges,
            }),
          );
        },
      };
    }),
  );
};

export type FamilyTreeStoreApi = ReturnType<typeof createFamilyTreeStore>;
