import { invariant } from 'es-toolkit';
import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import {
  buildConnectorData,
  type ConnectorRenderData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import type { AppDispatch } from '~/lib/interviewer/store';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';

enableMapSet();

export type Sex = 'male' | 'female';

export type NodeIsEgo = true | false;

export type Relationship = 'parent' | 'partner';

export type RelationshipToEgo =
  | 'maternal-grandmother'
  | 'maternal-grandfather'
  | 'paternal-grandmother'
  | 'paternal-grandfather'
  | 'maternal-aunt'
  | 'maternal-uncle'
  | 'maternal-aunts-partner'
  | 'maternal-uncles-partner'
  | 'paternal-aunt'
  | 'paternal-uncle'
  | 'paternal-aunts-partner'
  | 'paternal-uncles-partner'
  | 'fathers-partner'
  | 'mothers-partner'
  | 'mother'
  | 'father'
  | 'ego'
  | 'sister'
  | 'brother'
  | 'sisters-partner'
  | 'brothers-partner'
  | 'half-sister'
  | 'half-brother'
  | 'your-partner'
  | 'paternal-first-cousin'
  | 'maternal-first-cousin'
  | 'niece'
  | 'nephew'
  | 'daughter'
  | 'son'
  | 'daughters-partner'
  | 'sons-partner'
  | 'granddaughter'
  | 'grandson';

export type Edge = {
  id?: string;
  interviewNetworkId?: string;
  source: string;
  target: string;
  relationship: Relationship;
};

type NetworkState = {
  nodes: Map<string, Omit<FamilyTreeNodeType, 'id'>>;
  edges: Map<string, Omit<Edge, 'id'>>;
};

type FamilyTreeState = {
  step: 'scaffoldingStep' | 'nameGenerationStep' | 'diseaseNominationStep';
  network: NetworkState;
  connectorData: ConnectorRenderData | null;
};

type NetworkActions = {
  getNodeIdFromRelationship: (
    relationship: string,
  ) => string | null | undefined;
  addNode: (node: Omit<FamilyTreeNodeType, 'id'> & { id?: string }) => string;
  updateNode: (
    id: string,
    updates: Partial<Omit<FamilyTreeNodeType, 'id'>>,
  ) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<Edge, 'id'> & { id?: string }) => string | undefined;
  removeEdge: (id: string) => void;
  clearNetwork: () => void;
  getShellIdByNetworkId: (id: string) => string | null;
  generatePlaceholderNetwork: (
    formData: Record<string, number>,
    egoSex: Sex,
  ) => void;
  initializeMinimalNetwork: () => void;
  addPlaceholderNode: (
    relation: string,
    anchorId?: string,
    secondParentId?: string,
  ) => string;
  runLayout: () => void;
  syncMetadata: () => void;
};

type FamilyTreeAction = {
  setStep: (
    step: 'scaffoldingStep' | 'nameGenerationStep' | 'diseaseNominationStep',
  ) => void;
} & NetworkActions;

const initialState: FamilyTreeState = {
  step: 'scaffoldingStep',
  network: {
    nodes: new Map(),
    edges: new Map(),
  },
  connectorData: null,
};

const arrayFromRelationCount = (
  formData: Record<string, number>,
  relation: string,
) => Array.from({ length: formData[relation] ?? 0 });

export type FamilyTreeStore = FamilyTreeState & FamilyTreeAction;

export const createFamilyTreeStore = (
  initialNodes: Map<string, Omit<FamilyTreeNodeType, 'id'>>,
  initialEdges: Map<string, Omit<Edge, 'id'>>,
  init: FamilyTreeState = initialState,
  dispatch?: AppDispatch,
) => {
  init.network.nodes = initialNodes;
  init.network.edges = initialEdges;

  return createStore<FamilyTreeStore>()(
    immer((set, get) => {
      // Network traversal utilities
      const getNodeById = (id: string) => get().network.nodes.get(id);

      const getRelationship = (nodeId: string, type: 'partner') => {
        for (const edge of get().network.edges.values()) {
          if (edge.relationship === type) {
            if (edge.source === nodeId) return edge.target;
            if (edge.target === nodeId) return edge.source;
          }
        }
        return null;
      };

      const getPartner = (id: string) => getRelationship(id, 'partner');

      // Get all partners of a node (returns array of partner node IDs)
      const getAllPartners = (nodeId: string): string[] => {
        const partners: string[] = [];
        for (const edge of get().network.edges.values()) {
          if (edge.relationship === 'partner') {
            if (edge.source === nodeId) partners.push(edge.target);
            if (edge.target === nodeId) partners.push(edge.source);
          }
        }
        return partners;
      };

      const getParents = (nodeId: string): string[] => {
        const edges = get().network.edges;
        const parents: string[] = [];
        for (const [, edge] of Array.from(edges.entries())) {
          if (edge.relationship === 'parent' && edge.target === nodeId) {
            parents.push(edge.source);
          }
        }
        return parents;
      };

      const updateReadOnly = (id: string | null) => {
        if (!id) return;
        const node = get().network.nodes.get(id);
        if (!node || node.isEgo) return;
        get().updateNode(id, { readOnly: true });
      };

      // marks both parents of a newly added child node readOnly
      const markParentAndPartnersReadOnly = (parentId: string) => {
        updateReadOnly(parentId);
        // Mark all partners as read-only
        const partners = getAllPartners(parentId);
        partners.forEach((partnerId) => updateReadOnly(partnerId));
      };

      // unlock a parent (and its partners) if they have no children left
      const unlockParentIfNoChildren = (parentId: string) => {
        const network = get().network;
        const parentNode = network.nodes.get(parentId);
        if (!parentNode) return;
        if (parentNode.isEgo) return; // never unlock ego

        // check any remaining 'parent' edges where this node is the source?
        let hasChildren = false;
        for (const edge of network.edges.values()) {
          if (edge.relationship === 'parent' && edge.source === parentId) {
            hasChildren = true;
            break;
          }
        }

        if (!hasChildren) {
          set((draft) => {
            const parent = draft.network.nodes.get(parentId);
            if (parent && !parent.isEgo) {
              parent.readOnly = false;
            }

            // unlock all partners (if present)
            const partners = getAllPartners(parentId);
            for (const partnerId of partners) {
              const partnerNode = draft.network.nodes.get(partnerId);
              // do not unlock ego parents (Mother/Father)
              if (
                partnerNode &&
                !partnerNode.isEgo &&
                typeof partnerNode.label === 'string' &&
                partnerNode.label.toLowerCase() !== 'mother' &&
                partnerNode.label.toLowerCase() !== 'father'
              ) {
                partnerNode.readOnly = false;
              }
            }
          });
        }
      };

      // if a deleted node had a partner, see if they should also be deleted
      const maybeDeletePartner = (partnerId: string | null) => {
        if (!partnerId) return;
        const network = get().network;
        const partnerNode = network.nodes.get(partnerId);
        if (!partnerNode || partnerNode.isEgo) return;

        // count how many remaining relationship edges this partner still has
        const hasOtherConnections = Array.from(network.edges.values()).some(
          (edge) =>
            edge.relationship &&
            (edge.source === partnerId || edge.target === partnerId),
        );

        if (!hasOtherConnections) {
          // no remaining relationships, delete partner too
          get().removeNode(partnerId);
        }
      };

      return {
        ...init,

        setStep: (step) =>
          set((state) => {
            state.step = step;
          }),

        getRelationshipToEgo: (nodeId: string) => {
          const nodes = get().network.nodes;
          const egoId = Array.from(nodes.entries()).find(
            ([, node]) => node.isEgo,
          )?.[0];
          if (egoId == null) {
            return '';
          }
          if (nodeId === egoId) {
            return 'ego';
          }
          const egoPartnerId = getPartner(egoId);
          if (nodeId === egoPartnerId) {
            return 'ego-partner';
          }
          const egoParents = getParents(egoId);
          const motherId = egoParents.find(
            (id) => getNodeById(id)?.sex === 'female',
          );
          if (nodeId === motherId) {
            return 'mother';
          }
          if (motherId) {
            const maternalGrandparents = getParents(motherId);
            const maternalGrandmotherId = maternalGrandparents.find(
              (id) => getNodeById(id)?.sex === 'female',
            );
            if (nodeId === maternalGrandmotherId) {
              return 'maternal-grandmother';
            }
            const maternalGrandfatherId = maternalGrandparents.find(
              (id) => getNodeById(id)?.sex === 'male',
            );
            if (nodeId === maternalGrandfatherId) {
              return 'maternal-grandfather';
            }
          }
          const fatherId = egoParents.find(
            (id) => getNodeById(id)?.sex === 'male',
          );
          if (nodeId === fatherId) {
            return 'father';
          }
          if (fatherId) {
            const paternalGrandparents = getParents(fatherId);
            const paternalGrandmotherId = paternalGrandparents.find(
              (id) => getNodeById(id)?.sex === 'female',
            );
            if (nodeId === paternalGrandmotherId) {
              return 'paternal-grandmother';
            }
            const paternalGrandfatherId = paternalGrandparents.find(
              (id) => getNodeById(id)?.sex === 'male',
            );
            if (nodeId === paternalGrandfatherId) {
              return 'paternal-grandfather';
            }
          }
        },

        getNodeIdFromRelationship: (relationship: string) => {
          const nodes = get().network.nodes;
          const egoId = Array.from(nodes.entries()).find(
            ([, node]) => node.isEgo,
          )?.[0];
          if (egoId == null) {
            return null;
          }
          if (relationship === 'ego') {
            return egoId;
          }
          if (relationship === 'ego-partner') {
            return getPartner(egoId);
          }
          const egoParents = getParents(egoId);
          if (relationship === 'mother' || /maternal/.exec(relationship)) {
            const motherId = egoParents.find(
              (id) => getNodeById(id)?.sex === 'female',
            );
            if (relationship === 'mother') {
              return motherId;
            }
            if (motherId) {
              const maternalGrandparents = getParents(motherId);
              if (relationship === 'maternal-grandmother') {
                return maternalGrandparents.find(
                  (id) => getNodeById(id)?.sex === 'female',
                );
              }
              if (relationship === 'maternal-grandfather') {
                return maternalGrandparents.find(
                  (id) => getNodeById(id)?.sex === 'male',
                );
              }
            }
          }
          if (relationship === 'father' || /paternal/.exec(relationship)) {
            const fatherId = egoParents.find(
              (id) => getNodeById(id)?.sex === 'male',
            );
            if (relationship === 'father') {
              return fatherId;
            }
            if (fatherId) {
              const paternalGrandparents = getParents(fatherId);
              if (relationship === 'paternal-grandmother') {
                return paternalGrandparents.find(
                  (id) => getNodeById(id)?.sex === 'female',
                );
              }
              if (relationship === 'paternal-grandfather') {
                return paternalGrandparents.find(
                  (id) => getNodeById(id)?.sex === 'male',
                );
              }
            }
          }
        },

        addNode: (node) => {
          const id = node.id ?? crypto.randomUUID();

          set((state) => {
            invariant(
              !state.network.nodes.has(id),
              `Node with ID ${id} already exists`,
            );

            state.network.nodes.set(id, {
              ...node,
            });
          });

          return id;
        },

        updateNode: (id, updates) => {
          set((state) => {
            const node = state.network.nodes.get(id);
            invariant(node, `Node with ID ${id} does not exist`);
            Object.assign(node, updates);
          });
        },

        removeNode: (id) => {
          // track parents before deletion
          const parents = getParents(id);

          // track all partners before deletion
          const partnerIds = getAllPartners(id);

          set((state) => {
            const { nodes, edges } = state.network;

            // remove this node and all edges connected to it
            nodes.delete(id);
            const edgesToRemove: string[] = [];
            edges.forEach((edge, edgeId) => {
              if (edge.source === id || edge.target === id) {
                edgesToRemove.push(edgeId);
              }
            });
            edgesToRemove.forEach((edgeId) => edges.delete(edgeId));
          });

          // check if parents should be unlocked
          parents.forEach((parentId) => unlockParentIfNoChildren(parentId));

          // maybe delete partners if they have no other connections
          partnerIds.forEach((partnerId) => maybeDeletePartner(partnerId));

          get().runLayout();
          get().syncMetadata();
        },

        addEdge: ({ id, source, target, relationship }) => {
          const edgeId = id ?? `${source}-${target}-${relationship}`;
          set((state) => {
            if (state.network.edges.has(edgeId)) {
              return; // Edge already exists
            }
            state.network.edges.set(edgeId, {
              source,
              target,
              relationship,
            });
          });

          // if this edge is a parent–child connection, mark the parents readOnly
          if (relationship === 'parent') {
            markParentAndPartnersReadOnly(source);
          }

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

        getShellIdByNetworkId: (networkId: string) => {
          for (const [id, node] of get().network.nodes.entries()) {
            if (node.interviewNetworkId === networkId) return id;
          }
          return null;
        },

        generatePlaceholderNetwork: (formData, egoSex) => {
          const store = get();

          // Use the existing structure from initializeMinimalNetwork
          const { addNode, addEdge, updateNode, getNodeIdFromRelationship } =
            store;

          // Get existing nodes from the minimal network
          const egoId = getNodeIdFromRelationship('ego');
          const motherId = getNodeIdFromRelationship('mother');
          const fatherId = getNodeIdFromRelationship('father');
          const maternalGrandfatherId = getNodeIdFromRelationship(
            'maternal-grandfather',
          );
          const maternalGrandmotherId = getNodeIdFromRelationship(
            'maternal-grandmother',
          );
          const paternalGrandfatherId = getNodeIdFromRelationship(
            'paternal-grandfather',
          );
          const paternalGrandmotherId = getNodeIdFromRelationship(
            'paternal-grandmother',
          );

          // Guard: minimal network must exist
          if (
            !egoId ||
            !motherId ||
            !fatherId ||
            !maternalGrandfatherId ||
            !maternalGrandmotherId ||
            !paternalGrandfatherId ||
            !paternalGrandmotherId
          ) {
            // eslint-disable-next-line no-console
            console.warn(
              'generatePlaceholderNetwork: minimal network not initialized',
            );
            return;
          }

          // Update ego's sex
          updateNode(egoId, { sex: egoSex });

          // Add siblings
          arrayFromRelationCount(formData, 'brothers').forEach(() => {
            const brotherId = addNode({
              label: 'brother',
              sex: 'male',
              readOnly: false,
            });
            addEdge({
              source: fatherId,
              target: brotherId,
              relationship: 'parent',
            });
            addEdge({
              source: motherId,
              target: brotherId,
              relationship: 'parent',
            });
          });

          arrayFromRelationCount(formData, 'sisters').forEach(() => {
            const sisterId = addNode({
              label: 'sister',
              sex: 'female',
              readOnly: false,
            });
            addEdge({
              source: fatherId,
              target: sisterId,
              relationship: 'parent',
            });
            addEdge({
              source: motherId,
              target: sisterId,
              relationship: 'parent',
            });
          });

          // Ego's children and partner
          if (
            egoId != null &&
            ((formData.sons ?? 0) > 0 || (formData.daughters ?? 0) > 0)
          ) {
            const egoPartnerId = addNode({
              label: 'Your partner',
              sex: egoSex === 'female' ? 'male' : 'female',
              readOnly: true,
            });
            addEdge({
              target: egoId,
              source: egoPartnerId,
              relationship: 'partner',
            });

            arrayFromRelationCount(formData, 'sons').forEach(() => {
              const sonId = addNode({
                label: 'son',
                sex: 'male',
                readOnly: false,
              });
              addEdge({
                source: egoId,
                target: sonId,
                relationship: 'parent',
              });
              addEdge({
                source: egoPartnerId,
                target: sonId,
                relationship: 'parent',
              });
            });

            arrayFromRelationCount(formData, 'daughters').forEach(() => {
              const daughterId = addNode({
                label: 'daughter',
                sex: 'female',
                readOnly: false,
              });
              addEdge({
                source: egoId,
                target: daughterId,
                relationship: 'parent',
              });
              addEdge({
                source: egoPartnerId,
                target: daughterId,
                relationship: 'parent',
              });
            });
          }

          // Paternal uncles and aunts
          arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
            const uncleId = addNode({
              label: 'paternal uncle',
              sex: 'male',
              readOnly: false,
            });
            addEdge({
              source: paternalGrandfatherId,
              target: uncleId,
              relationship: 'parent',
            });
            addEdge({
              source: paternalGrandmotherId,
              target: uncleId,
              relationship: 'parent',
            });
          });

          arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
            const auntId = addNode({
              label: 'paternal aunt',
              sex: 'female',
              readOnly: false,
            });
            addEdge({
              source: paternalGrandfatherId,
              target: auntId,
              relationship: 'parent',
            });
            addEdge({
              source: paternalGrandmotherId,
              target: auntId,
              relationship: 'parent',
            });
          });

          // Maternal uncles and aunts
          arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
            const uncleId = addNode({
              label: 'maternal uncle',
              sex: 'male',
              readOnly: false,
            });
            addEdge({
              source: maternalGrandfatherId,
              target: uncleId,
              relationship: 'parent',
            });
            addEdge({
              source: maternalGrandmotherId,
              target: uncleId,
              relationship: 'parent',
            });
          });

          arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
            const auntId = addNode({
              label: 'maternal aunt',
              sex: 'female',
              readOnly: false,
            });
            addEdge({
              source: maternalGrandfatherId,
              target: auntId,
              relationship: 'parent',
            });
            addEdge({
              source: maternalGrandmotherId,
              target: auntId,
              relationship: 'parent',
            });
          });

          // Father's additional partners
          arrayFromRelationCount(
            formData,
            'fathers-additional-partners',
          ).forEach((_, index) => {
            const additionalPartnerId = addNode({
              label: `father's partner ${index + 2}`,
              sex: 'female',
              readOnly: false,
            });
            addEdge({
              source: fatherId,
              target: additionalPartnerId,
              relationship: 'partner',
            });
          });

          // Mother's additional partners
          arrayFromRelationCount(
            formData,
            'mothers-additional-partners',
          ).forEach((_, index) => {
            const additionalPartnerId = addNode({
              label: `mother's partner ${index + 2}`,
              sex: 'male',
              readOnly: false,
            });
            addEdge({
              source: additionalPartnerId,
              target: motherId,
              relationship: 'partner',
            });
          });

          store.runLayout();
        },

        /**
         * Initialize a minimal family tree structure without census form data.
         * Creates grandparents, parents, and connects ego.
         * Used when showQuickStartModal is false.
         */
        initializeMinimalNetwork: () => {
          const store = get();
          const { addNode, addEdge, updateNode, network } = store;

          // Check if network already has structure (more than just ego)
          const hasStructure = network.nodes.size > 1;
          if (hasStructure) return;

          // Find ego node
          const egoEntry = Array.from(network.nodes.entries()).find(
            ([, node]) => node.isEgo,
          );
          if (!egoEntry) return;

          const [egoId, egoNode] = egoEntry;
          const egoSex = egoNode.sex ?? 'female';

          // Maternal grandparents
          const maternalGrandmotherId = addNode({
            label: 'maternal grandmother',
            sex: 'female',
            readOnly: true,
          });
          const maternalGrandfatherId = addNode({
            label: 'maternal grandfather',
            sex: 'male',
            readOnly: true,
          });
          addEdge({
            source: maternalGrandfatherId,
            target: maternalGrandmotherId,
            relationship: 'partner',
          });

          // Paternal grandparents
          const paternalGrandmotherId = addNode({
            label: 'paternal grandmother',
            sex: 'female',
            readOnly: true,
          });
          const paternalGrandfatherId = addNode({
            label: 'paternal grandfather',
            sex: 'male',
            readOnly: true,
          });
          addEdge({
            source: paternalGrandfatherId,
            target: paternalGrandmotherId,
            relationship: 'partner',
          });

          // Mother
          const motherId = addNode({
            label: 'mother',
            sex: 'female',
            readOnly: true,
          });
          addEdge({
            source: maternalGrandfatherId,
            target: motherId,
            relationship: 'parent',
          });
          addEdge({
            source: maternalGrandmotherId,
            target: motherId,
            relationship: 'parent',
          });

          // Father
          const fatherId = addNode({
            label: 'father',
            sex: 'male',
            readOnly: true,
          });
          addEdge({
            source: paternalGrandfatherId,
            target: fatherId,
            relationship: 'parent',
          });
          addEdge({
            source: paternalGrandmotherId,
            target: fatherId,
            relationship: 'parent',
          });
          addEdge({
            source: fatherId,
            target: motherId,
            relationship: 'partner',
          });

          // Connect ego to parents
          updateNode(egoId, { sex: egoSex });
          addEdge({
            source: fatherId,
            target: egoId,
            relationship: 'parent',
          });
          addEdge({
            source: motherId,
            target: egoId,
            relationship: 'parent',
          });

          store.runLayout();
        },

        addPlaceholderNode: (
          relation: string,
          anchorId?: string,
          secondParentId?: string,
        ) => {
          const store = get();
          const { addNode, addEdge, network, getNodeIdFromRelationship } =
            store;

          const inferSex = (relation: string): Sex => {
            if (
              /brother|uncle|son|nephew|father|grandfather|Male/i.test(relation)
            )
              return 'male';
            if (
              /sister|aunt|daughter|niece|mother|grandmother|Female/i.test(
                relation,
              )
            )
              return 'female';
            return 'female';
          };

          const formatRelationLabel = (
            relation: string,
            anchorId?: string,
          ): string => {
            let rel = relation
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .toLowerCase()
              .trim();

            rel = rel.replace(/\s+(male|female)$/i, '');

            const sideRelations = /(aunt|uncle|cousin)/;

            if (!anchorId || !sideRelations.test(rel)) return rel;

            const anchorLabel =
              get().network.nodes.get(anchorId)?.label?.toLowerCase() ?? '';

            const prefix =
              anchorLabel.includes('mother') || anchorLabel.includes('maternal')
                ? 'maternal'
                : anchorLabel.includes('father') ||
                    anchorLabel.includes('paternal')
                  ? 'paternal'
                  : '';

            return prefix ? `${prefix} ${rel}` : rel;
          };

          const ensurePartner = (nodeId: string): string | null => {
            const node = network.nodes.get(nodeId);
            if (!node) return null;

            // Check if partner already exists
            for (const [, edge] of network.edges) {
              if (
                edge.relationship === 'partner' &&
                (edge.source === nodeId || edge.target === nodeId)
              ) {
                return edge.source === nodeId ? edge.target : edge.source;
              }
            }

            // If not, create one
            const partnerSex = node.sex === 'male' ? 'female' : 'male';
            const partnerId = addNode({
              label: node.isEgo ? 'Your partner' : `${node.label}'s partner`,
              sex: partnerSex,
              readOnly: true,
            });

            if (node.isEgo) {
              addEdge({
                source: partnerId,
                target: nodeId,
                relationship: 'partner',
              });
            } else {
              addEdge({
                source: node.sex === 'female' ? partnerId : nodeId,
                target: node.sex === 'female' ? nodeId : partnerId,
                relationship: 'partner',
              });
            }

            return partnerId;
          };

          // Find all partners of a node (returns array of partner node IDs)
          const findAllPartners = (nodeId: string): string[] => {
            const partners: string[] = [];
            for (const [, edge] of network.edges) {
              if (
                edge.relationship === 'partner' &&
                (edge.source === nodeId || edge.target === nodeId)
              ) {
                const partnerId =
                  edge.source === nodeId ? edge.target : edge.source;
                partners.push(partnerId);
              }
            }
            return partners;
          };

          // Find an additional partner (not the primary spouse) for half-sibling creation
          const findAdditionalPartner = (
            nodeId: string,
            excludeId?: string,
          ): string | null => {
            const partners = findAllPartners(nodeId);
            // Return first partner that isn't the excluded one (usually the primary spouse)
            for (const partnerId of partners) {
              if (partnerId !== excludeId) {
                return partnerId;
              }
            }
            // No additional partners found (only the primary spouse exists)
            return null;
          };

          const connectAsChild = (parentId: string) => {
            const parent = get().network.nodes.get(parentId);
            if (!parent) return;
            addEdge({
              source: parentId,
              target: newNodeId,
              relationship: 'parent',
            });
          };

          const label = formatRelationLabel(relation, anchorId);
          const sex = inferSex(relation);
          const newNodeId = addNode({
            label: label,
            sex,
            readOnly: false,
          });

          const rel = relation.toLowerCase();

          // additional partner creation
          if (rel === 'additionalpartner' || rel === 'additional-partner') {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`Additional partner relation requires anchorId`);
              return newNodeId;
            }
            const anchorNode = network.nodes.get(anchorId);
            if (!anchorNode) {
              // eslint-disable-next-line no-console
              console.warn(
                `Additional partner anchor node not found: ${anchorId}`,
              );
              return newNodeId;
            }

            // Update the new node's sex to be opposite of anchor
            const partnerSex = anchorNode.sex === 'male' ? 'female' : 'male';
            get().updateNode(newNodeId, {
              sex: partnerSex,
              label: `${anchorNode.label}'s partner`,
              readOnly: false,
            });

            // Create partner edge
            addEdge({
              source: anchorNode.sex === 'male' ? anchorId : newNodeId,
              target: anchorNode.sex === 'male' ? newNodeId : anchorId,
              relationship: 'partner',
            });
          }

          // half siblings - connect to parent and their additional partner
          else if (rel.includes('half')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`half relation requires anchorId`);
              return newNodeId;
            }

            // Use provided second parent, or fall back to finding an additional partner
            // For half-siblings, we want a partner that isn't ego's other parent
            const egoId = getNodeIdFromRelationship('ego');
            const egoParents = egoId ? getParents(egoId) : [];
            const primaryPartnerId = egoParents.find((id) => id !== anchorId);
            const additionalPartnerId =
              secondParentId ??
              findAdditionalPartner(anchorId, primaryPartnerId);

            connectAsChild(anchorId);
            if (additionalPartnerId) connectAsChild(additionalPartnerId);
          }

          // ego’s children
          else if (rel === 'son' || rel === 'daughter') {
            const egoId = getNodeIdFromRelationship('ego');
            if (egoId != null && network.nodes.has(egoId)) {
              const partnerId = ensurePartner(egoId);
              connectAsChild(egoId);
              if (partnerId) connectAsChild(partnerId);
            }
          }

          // siblings (brother, sister)
          else if (rel.includes('brother') || rel.includes('sister')) {
            // always connect to both parents
            const motherId = getNodeIdFromRelationship('mother');
            if (motherId != null && network.nodes.has(motherId))
              connectAsChild(motherId);
            const fatherId = getNodeIdFromRelationship('father');
            if (fatherId != null && network.nodes.has(fatherId))
              connectAsChild(fatherId);
          }

          // nieces and nephews (child of ego's sibling)
          else if (rel.includes('niece') || rel.includes('nephew')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`Niece/nephew relation requires anchorId`);
              return newNodeId;
            }
            // Use provided second parent, or fall back to ensuring partner exists
            const partnerId = secondParentId ?? ensurePartner(anchorId);
            connectAsChild(anchorId);
            if (partnerId) connectAsChild(partnerId);
          }

          // cousins (child of aunt/uncle)
          else if (rel.includes('cousin')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`Cousin relation requires anchorId`);
              return newNodeId;
            }
            // Use provided second parent, or fall back to ensuring partner exists
            const partnerId = secondParentId ?? ensurePartner(anchorId);
            connectAsChild(anchorId);
            if (partnerId) connectAsChild(partnerId);
          }

          // grandchildren
          else if (rel.includes('grandson') || rel.includes('granddaughter')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`Grandchild relation requires anchorId`);
              return newNodeId;
            }
            // Use provided second parent, or fall back to ensuring partner exists
            const partnerId = secondParentId ?? ensurePartner(anchorId);
            connectAsChild(anchorId);
            if (partnerId) connectAsChild(partnerId);
          }

          // half aunt/uncle (sibling of parent with different grandparent partner)
          // Must be checked BEFORE regular aunt/uncle since 'halfaunt'.includes('aunt') is true
          else if (rel.includes('halfaunt') || rel.includes('halfuncle')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(
                `Half aunt/uncle relation requires anchorId (grandparent)`,
              );
              return newNodeId;
            }
            // anchorId is the biological grandparent
            // secondParentId is the additional partner of that grandparent
            connectAsChild(anchorId);
            if (secondParentId) {
              connectAsChild(secondParentId);
            }
          }

          // aunt/uncle (full sibling of parent)
          else if (rel.includes('aunt') || rel.includes('uncle')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`Aunt/uncle relation requires anchorId`);
              return newNodeId;
            }
            for (const [, edge] of network.edges) {
              if (edge.relationship === 'parent' && edge.target === anchorId) {
                connectAsChild(edge.source);
              }
            }
          }

          store.runLayout();
          return newNodeId;
        },

        runLayout: () => {
          const { nodes, edges } = get().network;
          const { input, indexToId } = storeToPedigreeInput(nodes, edges);

          if (input.id.length === 0) return;

          const layout = alignPedigree(input);
          const positions = pedigreeLayoutToPositions(layout, indexToId);
          const connData = buildConnectorData(layout, edges);

          set((draft) => {
            for (const [nodeId, position] of positions) {
              const node = draft.network.nodes.get(nodeId);
              if (node) {
                node.x = position.x;
                node.y = position.y;
              }
            }
            draft.connectorData = connData;
          });
        },

        syncMetadata: () => {
          if (!dispatch) return;

          const committedNodes = Array.from(get().network.nodes.values())
            .filter((n) => n.interviewNetworkId != null)
            .map((n) => ({
              interviewNetworkId: n.interviewNetworkId!,
              label: n.label,
              sex: n.sex!,
              isEgo: n.isEgo === true,
              readOnly: n.readOnly ?? false,
            }));

          dispatch(
            updateStageMetadata({
              hasSeenScaffoldPrompt: true,
              nodes: committedNodes,
            }),
          );
        },
      };
    }),
  );
};

export type FamilyTreeStoreApi = ReturnType<typeof createFamilyTreeStore>;
