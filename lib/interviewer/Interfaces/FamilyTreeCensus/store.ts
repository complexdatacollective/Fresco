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
  gender?: Gender[];
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
  isBioRelative?: boolean;
};

export type PersonDetail = {
  name: string;
  sex?: Sex;
  gender?: Gender[];
};

export type ParentDetail = PersonDetail & {
  nameKnown: boolean;
  raisedYou: boolean;
  biologicallyRelated: boolean;
  auxiliaryRole?: 'donor' | 'surrogate' | 'none';
};

export type BioParentDetail = PersonDetail & {
  nameKnown: boolean;
  auxiliaryRole: 'donor' | 'surrogate' | 'none';
};

export type QuickStartData = {
  parents: ParentDetail[];
  bioParents: BioParentDetail[];
  siblings: PersonDetail[];
  siblingParentMap?: Record<number, number[]>;
  parentPartnerships?: [number, number][];
  partner: (PersonDetail & { hasPartner: true }) | { hasPartner: false };
  childrenWithPartner: PersonDetail[];
  otherChildren: PersonDetail[];
};

export type StoreEdge = {
  source: string;
  target: string;
} & (
  | { type: 'parent'; edgeType: ParentEdgeType; biological?: boolean }
  | { type: 'partner'; active: boolean }
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

function deriveParentEdgeType(parent: ParentDetail): ParentEdgeType {
  if (parent.raisedYou) return 'social-parent';
  if (parent.auxiliaryRole === 'surrogate') return 'surrogate';
  if (parent.auxiliaryRole === 'donor') return 'donor';
  return 'bio-parent';
}

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
              label: parent.nameKnown ? parent.name : '',
              sex: parent.sex,
              gender: parent.gender,
              isEgo: false,
            });
            parentIds.push(parentId);
            get().addEdge({
              source: parentId,
              target: egoId,
              type: 'parent',
              edgeType: deriveParentEdgeType(parent),
              biological: parent.biologicallyRelated,
            });
          }

          // Create biological parent nodes
          const bioParentIds: string[] = [];
          for (const bp of data.bioParents) {
            const bpId = get().addNode({
              label: bp.nameKnown ? bp.name : '',
              sex: bp.sex,
              gender: bp.gender,
              isEgo: false,
            });
            bioParentIds.push(bpId);
            get().addEdge({
              source: bpId,
              target: egoId,
              type: 'parent',
              edgeType:
                bp.auxiliaryRole === 'surrogate'
                  ? 'surrogate'
                  : bp.auxiliaryRole === 'donor'
                    ? 'donor'
                    : 'bio-parent',
              biological: true,
            });
          }

          // Create siblings with per-sibling parent mapping
          const siblingIds: string[] = [];
          for (let si = 0; si < data.siblings.length; si++) {
            const sibling = data.siblings[si]!;
            const siblingId = get().addNode({
              label: sibling.name,
              sex: sibling.sex,
              gender: sibling.gender,
              isEgo: false,
            });
            siblingIds.push(siblingId);

            const assignedParentIndices =
              data.siblingParentMap?.[si] ??
              data.parents
                .map((_, i) => i)
                .filter((i) => data.parents[i]?.raisedYou);

            for (const pi of assignedParentIndices) {
              const pid = parentIds[pi];
              if (pid) {
                get().addEdge({
                  source: pid,
                  target: siblingId,
                  type: 'parent',
                  edgeType: 'social-parent',
                });
              }
            }
          }

          // Create partner edges between parents
          if (data.parentPartnerships) {
            for (const [a, b] of data.parentPartnerships) {
              const idA = parentIds[a];
              const idB = parentIds[b];
              if (idA && idB) {
                get().addEdge({
                  source: idA,
                  target: idB,
                  type: 'partner',
                  active: true,
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
              active: true,
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
              edgeType: 'parent',
              biological: true,
            });
            if (partnerId) {
              get().addEdge({
                source: partnerId,
                target: childId,
                type: 'parent',
                edgeType: 'parent',
                biological: true,
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
              edgeType: 'parent',
              biological: true,
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
