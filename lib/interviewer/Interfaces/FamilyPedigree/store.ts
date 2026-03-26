import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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

export type NodeData = {
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
  isBioRelative?: boolean;
  adoptionStatus?: AdoptionStatus;
  attributes: Record<string, unknown>;
};

export type PersonDetail = {
  name: string;
  biologicalSex?: string;
  attributes?: Record<string, unknown>;
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

export type GrandparentDetail = PersonDetail & {
  nameKnown: boolean;
};

export type AuntUncleDetail = PersonDetail &
  (
    | { hasChildren: false; children: [] }
    | {
        hasChildren: true;
        hasPartner: boolean;
        partner?: PersonDetail;
        children: PersonDetail[];
      }
  );

export type ParentBranch = {
  parentIndex: number;
  grandparents: [GrandparentDetail, GrandparentDetail];
  auntUncleCount: number;
  auntsUncles: AuntUncleDetail[];
};

export type SiblingFamily = {
  siblingIndex: number;
  hasPartner: boolean;
  partner?: PersonDetail;
  children: PersonDetail[];
};

export type HalfSiblingOtherParent = PersonDetail & {
  nameKnown: boolean;
  siblingIndex: number;
  sharedParentIndices: number[];
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
  parentBranches: ParentBranch[];
  halfSiblingOtherParents: HalfSiblingOtherParent[];
  siblingFamilies: SiblingFamily[];
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

function personToNodeData(
  person: PersonDetail,
  variableConfig: VariableConfig,
): NodeData {
  return {
    isEgo: false,
    attributes: {
      [variableConfig.nodeLabelVariable]: person.name,
      [variableConfig.biologicalSexVariable]: person.biologicalSex,
      ...person.attributes,
    },
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
          get().clearNetwork();

          const egoId = get().addNode({
            isEgo: true,
            adoptionStatus: data.adoptionStatus,
            attributes: { [variableConfig.nodeLabelVariable]: '' },
          });

          const egoParentSet = data.egoParentIndices
            ? new Set(data.egoParentIndices)
            : null;

          const parentIds: string[] = [];
          for (let pi = 0; pi < data.parents.length; pi++) {
            const parent = data.parents[pi]!;
            const parentId = get().addNode(
              personToNodeData(parent, variableConfig),
            );
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

          const bioParentIds: string[] = [];
          for (const bp of data.bioParents) {
            const bpId = get().addNode({
              ...personToNodeData(bp, variableConfig),
              attributes: {
                ...personToNodeData(bp, variableConfig).attributes,
                [variableConfig.nodeLabelVariable]: bp.nameKnown ? bp.name : '',
              },
            });
            bioParentIds.push(bpId);
            get().addEdge({
              source: bpId,
              target: egoId,
              relationshipType: 'biological',
              isActive: true,
            });
          }

          const unifiedParentNodeIds = [...parentIds, ...bioParentIds];

          const grandparentIdsByBranch = new Map<number, [string, string]>();
          for (
            let branchIdx = 0;
            branchIdx < data.parentBranches.length;
            branchIdx++
          ) {
            const branch = data.parentBranches[branchIdx]!;
            const parentNodeId = unifiedParentNodeIds[branch.parentIndex];
            if (!parentNodeId) continue;

            const gpIds: [string, string] = ['', ''];
            for (const gpIdx of [0, 1] as const) {
              const gp = branch.grandparents[gpIdx];
              const gpId = get().addNode(
                personToNodeData(
                  {
                    name: gp.nameKnown ? gp.name : '',
                    biologicalSex: gp.biologicalSex,
                    attributes: gp.attributes,
                  },
                  variableConfig,
                ),
              );
              gpIds[gpIdx] = gpId;

              get().addEdge({
                source: gpId,
                target: parentNodeId,
                relationshipType: 'biological',
                isActive: true,
              });
            }

            get().addEdge({
              source: gpIds[0],
              target: gpIds[1],
              relationshipType: 'partner',
              isActive: true,
            });

            grandparentIdsByBranch.set(branchIdx, gpIds);
          }

          // --- Extended family: Aunts/uncles & cousins ---
          for (
            let branchIdx = 0;
            branchIdx < data.parentBranches.length;
            branchIdx++
          ) {
            const branch = data.parentBranches[branchIdx]!;
            const gpIds = grandparentIdsByBranch.get(branchIdx);
            if (!gpIds) continue;

            for (const au of branch.auntsUncles) {
              const auId = get().addNode(personToNodeData(au, variableConfig));

              // Link to same grandparents as parent (full sibling simplification)
              get().addEdge({
                source: gpIds[0],
                target: auId,
                relationshipType: 'biological',
                isActive: true,
              });
              get().addEdge({
                source: gpIds[1],
                target: auId,
                relationshipType: 'biological',
                isActive: true,
              });

              if (au.hasChildren) {
                let auPartnerId: string | undefined;
                if (au.hasPartner && au.partner) {
                  auPartnerId = get().addNode(
                    personToNodeData(au.partner, variableConfig),
                  );
                  get().addEdge({
                    source: auId,
                    target: auPartnerId,
                    relationshipType: 'partner',
                    isActive: true,
                  });
                }

                for (const cousin of au.children) {
                  const cousinId = get().addNode(
                    personToNodeData(cousin, variableConfig),
                  );
                  get().addEdge({
                    source: auId,
                    target: cousinId,
                    relationshipType: 'biological',
                    isActive: true,
                  });
                  if (auPartnerId) {
                    get().addEdge({
                      source: auPartnerId,
                      target: cousinId,
                      relationshipType: 'biological',
                      isActive: true,
                    });
                  }
                }
              }
            }
          }

          for (const sibling of data.siblings) {
            const siblingId = get().addNode(
              personToNodeData(sibling, variableConfig),
            );
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
            partnerId = get().addNode(
              personToNodeData(data.partner, variableConfig),
            );
            get().addEdge({
              source: egoId,
              target: partnerId,
              relationshipType: 'partner',
              isActive: true,
            });
          }

          for (const child of data.childrenWithPartner) {
            const childId = get().addNode(
              personToNodeData(child, variableConfig),
            );
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
            const childId = get().addNode(
              personToNodeData(child, variableConfig),
            );
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
            label:
              (node.attributes[variableConfig.nodeLabelVariable] as string) ??
              '',
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
