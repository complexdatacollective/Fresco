import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type NodeShape } from '~/components/Node';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import { type useAppDispatch } from '~/lib/interviewer/store';
import { type ParentEdge } from '~/schemas/familyPedigree';

enableMapSet();

export type AdoptionStatus = 'in' | 'out' | 'by-relative';

export type VariableConfig = {
  nodeLabelVariable: string;
  biologicalSexVariable: string;
  egoVariable: string;
  relationshipTypeVariable: string;
  isActiveVariable: string;
  isGestationalCarrierVariable: string;
};

export function sexToShape(sex: string | undefined): NodeShape | undefined {
  if (sex === 'female') return 'circle';
  if (sex === 'male') return 'square';
  if (sex === 'intersex' || sex === 'unknown') return 'diamond';
  return undefined;
}

export type NodeData = {
  label: string;
  shape?: NodeShape;
  biologicalSex?: string;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
  isBioRelative?: boolean;
  adoptionStatus?: AdoptionStatus;
};

export type PersonDetail = {
  name: string;
  biologicalSex?: string;
};

export type ParentDetail = PersonDetail & {
  nameKnown: boolean;
  edgeType: ParentEdge['relationshipType'];
  biological?: boolean;
};

export type BioParentDetail = PersonDetail & {
  nameKnown: boolean;
};

export type SiblingDetail = PersonDetail & {
  sharedParentIndices: number[];
};

export type ParentPartnership = {
  parentIndices: [number, number];
  isActive: boolean;
};

export type QuickStartData = {
  adoptionStatus?: AdoptionStatus;
  parents: ParentDetail[];
  egoParentIndices?: number[];
  parentPartnerships: ParentPartnership[];
  gestationalCarrierParentIndex?: number;
  bioParents: BioParentDetail[];
  siblings: SiblingDetail[];
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

function personToNodeData(person: PersonDetail): NodeData {
  return {
    label: person.name,
    biologicalSex: person.biologicalSex,
    shape: sexToShape(person.biologicalSex),
    isEgo: false,
  };
}

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

        generateQuickStartNetwork: (data) => {
          // Debug: expose data on window for inspection
          if (typeof window !== 'undefined') {
            (window as Record<string, unknown>).__QUICKSTART_DEBUG = {
              parents: data.parents.map((p) => ({ name: p.name, edgeType: p.edgeType })),
              egoParentIndices: data.egoParentIndices,
              siblings: data.siblings.map((s) => ({ name: s.name, shared: s.sharedParentIndices })),
            };
          }
          get().clearNetwork();

          const egoId = get().addNode({
            label: '',
            isEgo: true,
            adoptionStatus: data.adoptionStatus,
          });

          const egoParentSet = data.egoParentIndices
            ? new Set(data.egoParentIndices)
            : null;

          const parentIds: string[] = [];
          for (let pi = 0; pi < data.parents.length; pi++) {
            const parent = data.parents[pi]!;
            const parentId = get().addNode({
              ...personToNodeData(parent),
              label: parent.name,
            });
            parentIds.push(parentId);

            // Only create parent→ego edge if this parent is ego's parent
            const isEgoParent = !egoParentSet || egoParentSet.has(pi);
            if (isEgoParent) {
              const edgeId = get().addEdge({
                source: parentId,
                target: egoId,
                relationshipType: parent.edgeType,
                isActive: true,
              });

              // Mark gestational carrier on the parent→ego edge
              if (
                data.gestationalCarrierParentIndex !== undefined &&
                pi === data.gestationalCarrierParentIndex
              ) {
                set((state) => {
                  const edge = state.network.edges.get(edgeId);
                  if (edge && edge.relationshipType !== 'partner') {
                    edge.isGestationalCarrier = true;
                  }
                });
              }
            }
          }

          // Create partner edges from explicit partnerships
          for (const partnership of data.parentPartnerships) {
            const [i, j] = partnership.parentIndices;
            const sourceId = parentIds[i];
            const targetId = parentIds[j];
            if (sourceId && targetId) {
              get().addEdge({
                source: sourceId,
                target: targetId,
                relationshipType: 'partner',
                isActive: partnership.isActive,
              });
            }
          }

          for (const bp of data.bioParents) {
            const bpId = get().addNode({
              ...personToNodeData(bp),
              label: bp.nameKnown ? bp.name : '',
            });
            get().addEdge({
              source: bpId,
              target: egoId,
              relationshipType: 'biological',
              isActive: true,
            });
          }

          for (const sibling of data.siblings) {
            const siblingId = get().addNode(personToNodeData(sibling));
            for (const parentIdx of sibling.sharedParentIndices) {
              const parentId = parentIds[parentIdx];
              if (!parentId) continue;

              // Determine edge type: use ego's edge if it exists, otherwise
              // fall back to the parent's configured edgeType (needed when a
              // parent is only the sibling's parent, not ego's).
              const parentEdge = [...get().network.edges.values()].find(
                (e) =>
                  e.relationshipType !== 'partner' &&
                  e.source === parentId &&
                  e.target === egoId,
              );
              const edgeType =
                parentEdge && parentEdge.relationshipType !== 'partner'
                  ? parentEdge.relationshipType
                  : (data.parents[parentIdx]?.edgeType ?? 'biological');

              get().addEdge({
                source: parentId,
                target: siblingId,
                relationshipType: edgeType,
                isActive: true,
              });
            }
          }

          let partnerId: string | undefined;
          if (data.partner.hasPartner) {
            partnerId = get().addNode(personToNodeData(data.partner));
            get().addEdge({
              source: egoId,
              target: partnerId,
              relationshipType: 'partner',
              isActive: true,
            });
          }

          for (const child of data.childrenWithPartner) {
            const childId = get().addNode(personToNodeData(child));
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
            const childId = get().addNode(personToNodeData(child));
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
            adoptionStatus: node.adoptionStatus,
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
