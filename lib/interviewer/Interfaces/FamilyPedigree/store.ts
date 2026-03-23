import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type NodeShape } from '~/components/Node';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import { type useAppDispatch } from '~/lib/interviewer/store';
import { type ParentEdge } from '~/schemas/familyPedigree';

enableMapSet();

export type NodeData = {
  label: string;
  shape?: NodeShape;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
  isBioRelative?: boolean;
};

export type PersonDetail = {
  name: string;
  shape?: NodeShape;
};

export type ParentDetail = PersonDetail & {
  nameKnown: boolean;
  edgeType: ParentEdge['relationshipType'];
  biological?: boolean;
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
  | {
      relationshipType: 'biological' | 'social' | 'donor' | 'surrogate';
      isActive: boolean;
      isGestationalCarrier?: boolean;
    }
  | { relationshipType: 'partner'; isActive: boolean }
);

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
  generateQuickStartNetwork: (data: QuickStartData) => void;
  syncMetadata: () => void;
};

export type FamilyPedigreeStore = FamilyPedigreeState & NetworkActions;

export const createFamilyPedigreeStore = (
  initialNodes: Map<string, NodeData>,
  initialEdges: Map<string, StoreEdge>,
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

        generateQuickStartNetwork: (data) => {
          get().clearNetwork();

          const egoId = get().addNode({ label: '', isEgo: true });

          const parentIds: string[] = [];
          for (const parent of data.parents) {
            const parentId = get().addNode({
              label: parent.name,
              shape: parent.shape,
              isEgo: false,
            });
            parentIds.push(parentId);
            get().addEdge({
              source: parentId,
              target: egoId,
              relationshipType: parent.edgeType,
              isActive: true,
            });
          }

          if (parentIds.length >= 2) {
            get().addEdge({
              source: parentIds[0]!,
              target: parentIds[1]!,
              relationshipType: 'partner',
              isActive: true,
            });
          }

          for (const bp of data.bioParents) {
            const bpId = get().addNode({
              label: bp.nameKnown ? bp.name : '',
              shape: bp.shape,
              isEgo: false,
            });
            get().addEdge({
              source: bpId,
              target: egoId,
              relationshipType: 'biological',
              isActive: true,
            });
          }

          for (const sibling of data.siblings) {
            const siblingId = get().addNode({
              label: sibling.name,
              shape: sibling.shape,
              isEgo: false,
            });
            for (const parentId of parentIds) {
              const parentEdge = [...get().network.edges.values()].find(
                (e) =>
                  e.relationshipType !== 'partner' &&
                  e.source === parentId &&
                  e.target === egoId,
              );
              if (parentEdge && parentEdge.relationshipType !== 'partner') {
                get().addEdge({
                  source: parentId,
                  target: siblingId,
                  relationshipType: parentEdge.relationshipType,
                  isActive: true,
                });
              }
            }
          }

          let partnerId: string | undefined;
          if (data.partner.hasPartner) {
            partnerId = get().addNode({
              label: data.partner.name,
              shape: data.partner.shape,
              isEgo: false,
            });
            get().addEdge({
              source: egoId,
              target: partnerId,
              relationshipType: 'partner',
              isActive: true,
            });
          }

          for (const child of data.childrenWithPartner) {
            const childId = get().addNode({
              label: child.name,
              shape: child.shape,
              isEgo: false,
            });
            get().addEdge({
              source: egoId,
              target: childId,
              relationshipType: 'biological',
              isActive: true,
            });
            if (partnerId) {
              get().addEdge({
                source: partnerId,
                target: childId,
                relationshipType: 'biological',
                isActive: true,
              });
            }
          }

          for (const child of data.otherChildren) {
            const childId = get().addNode({
              label: child.name,
              shape: child.shape,
              isEgo: false,
            });
            get().addEdge({
              source: egoId,
              target: childId,
              relationshipType: 'biological',
              isActive: true,
            });
          }
        },

        syncMetadata: () => {
          const { nodes, edges } = get().network;

          const serializedNodes = [...nodes.entries()].map(([id, node]) => ({
            id,
            interviewNetworkId: node.interviewNetworkId,
            label: node.label,
            shape: node.shape,
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

export type FamilyPedigreeStoreApi = ReturnType<
  typeof createFamilyPedigreeStore
>;
