import { invariant } from 'es-toolkit';
import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import type { AppDispatch } from '~/lib/interviewer/store';
import { type FamilyTreeNodeType } from './components/FamilyTreeNode';
import { FAMILY_TREE_CONFIG } from './config';

enableMapSet();

export type Sex = 'male' | 'female';

export type Relationship = 'parent' | 'partner' | 'ex-partner';

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
  addPlaceholderNode: (relation: string, anchorId?: string) => void;
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
};

const arrayFromRelationCount = (
  formData: Record<string, number>,
  relation: string,
) => Array.from({ length: formData[relation] ?? 0 });

export type FamilyTreeStore = FamilyTreeState & FamilyTreeAction;

type TreeSpacing = {
  siblings: number;
  partners: number;
  generations: number;
};

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

      const getRelationship = (
        nodeId: string,
        type: 'partner' | 'ex-partner',
      ) => {
        for (const edge of get().network.edges.values()) {
          if (edge.relationship === type) {
            if (edge.source === nodeId) return edge.target;
            if (edge.target === nodeId) return edge.source;
          }
        }
        return null;
      };

      const getPartner = (id: string) => getRelationship(id, 'partner');
      const getExPartner = (id: string) => getRelationship(id, 'ex-partner');

      const getParentToChildrenMap = (): Map<string, string[]> => {
        const edges = get().network.edges;
        const map = new Map<string, string[]>();
        for (const [, edge] of Array.from(edges.entries())) {
          if (edge.relationship === 'parent') {
            if (!map.has(edge.source)) map.set(edge.source, []);
            map.get(edge.source)!.push(edge.target);
          }
        }
        return map;
      };

      const getChildren = (nodeId: string): string[] => {
        const map = getParentToChildrenMap();
        return map.get(nodeId) ?? [];
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

      const getSharedChildren = (
        nodeId1: string,
        nodeId2: string,
      ): string[] => {
        const children1 = getChildren(nodeId1);
        const children2 = getChildren(nodeId2);
        return children1.filter((child) => children2.includes(child));
      };

      // Layout algorithm
      const runFamilyTreeLayout = (
        spacing: TreeSpacing = {
          siblings: FAMILY_TREE_CONFIG.siblingSpacing,
          partners: FAMILY_TREE_CONFIG.partnerSpacing,
          generations: FAMILY_TREE_CONFIG.rowHeight,
        },
      ): Map<string, { x: number; y: number }> => {
        const nodes = get().network.nodes;
        const positions = new Map<string, { x: number; y: number }>();

        // Find ego node
        const egoId = Array.from(nodes.entries()).find(
          ([, node]) => node.isEgo,
        )?.[0];
        if (!egoId) {
          // eslint-disable-next-line no-console
          console.warn('No ego node found for layout');
          return positions;
        }

        // Assign nodes to layers (generations)
        const layers = new Map<number, string[]>();
        const nodeToLayer = new Map<string, number>();
        const visited = new Set<string>();

        // BFS to assign layers starting from nodes with no parents
        const queue: { nodeId: string; layer: number }[] = [];

        // Find root nodes (no parents)
        for (const [nodeId] of Array.from(nodes.entries())) {
          if (getParents(nodeId).length === 0) {
            queue.push({ nodeId, layer: 0 });
          }
        }

        while (queue.length > 0) {
          const { nodeId, layer } = queue.shift()!;

          if (visited.has(nodeId)) {
            // Update layer if this is a deeper level
            const currentLayer = nodeToLayer.get(nodeId);
            if (currentLayer !== undefined && layer > currentLayer) {
              // Remove from old layer
              const oldLayerNodes = layers.get(currentLayer) ?? [];
              layers.set(
                currentLayer,
                oldLayerNodes.filter((id) => id !== nodeId),
              );

              // Add to new layer
              nodeToLayer.set(nodeId, layer);
              if (!layers.has(layer)) layers.set(layer, []);
              layers.get(layer)!.push(nodeId);
            }
            continue;
          }

          visited.add(nodeId);
          nodeToLayer.set(nodeId, layer);

          if (!layers.has(layer)) layers.set(layer, []);
          layers.get(layer)!.push(nodeId);

          // Add children to next layer
          getChildren(nodeId).forEach((childId) => {
            queue.push({ nodeId: childId, layer: layer + 1 });
          });
        }

        for (const [nodeId] of Array.from(nodes.entries())) {
          const partnerId = getPartner(nodeId);
          const exPartnerId = getExPartner(nodeId);

          // Combine both partner types into a single array for iteration
          const relatedPartners = [partnerId, exPartnerId].filter(
            (id): id is string => !!id,
          );

          for (const relatedPartnerId of relatedPartners) {
            const nodeLayer = nodeToLayer.get(nodeId);
            const partnerLayer = nodeToLayer.get(relatedPartnerId);

            if (
              nodeLayer !== undefined &&
              partnerLayer !== undefined &&
              nodeLayer !== partnerLayer
            ) {
              const targetLayer = Math.max(nodeLayer, partnerLayer);

              // Move both to the deeper layer
              [nodeId, relatedPartnerId].forEach((id) => {
                const oldLayer = nodeToLayer.get(id)!;
                if (oldLayer !== targetLayer) {
                  // Remove from old layer
                  const oldLayerNodes = layers.get(oldLayer) ?? [];
                  layers.set(
                    oldLayer,
                    oldLayerNodes.filter((layerId) => layerId !== id),
                  );

                  // Add to target layer
                  nodeToLayer.set(id, targetLayer);
                  if (!layers.has(targetLayer)) layers.set(targetLayer, []);
                  layers.get(targetLayer)!.push(id);
                }
              });
            }
          }
        }

        /**
         * Enforce child layers >= parent layer + 1
         * propagate downwards so grandchildren are moved
         */
        const parentToChildren = getParentToChildrenMap();

        // seed with all parents that have children
        const propagateQueue: string[] = Array.from(parentToChildren.keys());

        while (propagateQueue.length > 0) {
          const parentId = propagateQueue.shift()!;
          const parentLayer = nodeToLayer.get(parentId);
          if (parentLayer === undefined) continue; // if parent not assigned, continue

          const children = parentToChildren.get(parentId) ?? [];
          for (const childId of children) {
            // ensure child layer is one greater than parent layer
            const childLayer = nodeToLayer.get(childId) ?? parentLayer + 1;
            if (childLayer <= parentLayer) {
              const newChildLayer = parentLayer + 1;

              // remove from old layer assignment (if present)
              const oldLayer = nodeToLayer.get(childId);
              if (oldLayer !== undefined) {
                const oldList = layers.get(oldLayer) ?? [];
                layers.set(
                  oldLayer,
                  oldList.filter((id) => id !== childId),
                );
              }

              // set child's new layer and add to layers map
              nodeToLayer.set(childId, newChildLayer);
              if (!layers.has(newChildLayer)) layers.set(newChildLayer, []);
              layers.get(newChildLayer)!.push(childId);

              // enqueue child so its own children (grandchildren) will be checked
              propagateQueue.push(childId);
            }
          }
        }

        // Determine side ('maternal', 'paternal', or 'neutral') for each node
        const sides = new Map<string, 'maternal' | 'paternal' | 'neutral'>();
        const motherId = 'mother';
        const fatherId = 'father';

        sides.set(motherId, 'maternal');
        sides.set(fatherId, 'paternal');

        // Parent’s siblings (aunts/uncles)
        const addSideToParentSiblings = (
          parentId: string,
          side: 'maternal' | 'paternal',
        ) => {
          if (!parentId) return;
          const grandParents = getParents(parentId);
          if (grandParents.length === 0) return;

          // Find siblings: all other children of the same grandparents
          for (const [nodeId] of nodes.entries()) {
            const nodeParents = getParents(nodeId);
            if (
              nodeParents.length > 0 &&
              nodeParents.sort().join('|') === grandParents.sort().join('|')
            ) {
              sides.set(nodeId, side);
            }
          }
        };

        addSideToParentSiblings(motherId, 'maternal');
        addSideToParentSiblings(fatherId, 'paternal');

        // Propagate sides to their partners and descendants
        const propagateSide = (
          startIds: string[],
          side: 'maternal' | 'paternal',
        ) => {
          const queue = [...startIds];
          const visited = new Set<string>();
          while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            sides.set(nodeId, side);
            const partner = getPartner(nodeId);
            const exPartner = getExPartner(nodeId);
            const related = [partner, exPartner, ...getChildren(nodeId)].filter(
              Boolean,
            );
            queue.push(...related);
          }
        };

        const maternalRoots = [...sides.entries()]
          .filter(([, side]) => side === 'maternal')
          .map(([id]) => id);
        const paternalRoots = [...sides.entries()]
          .filter(([, side]) => side === 'paternal')
          .map(([id]) => id);
        propagateSide(maternalRoots, 'maternal');
        propagateSide(paternalRoots, 'paternal');

        // Order nodes within each layer based on family relationships
        const maxLayer = Math.max(...Array.from(layers.keys()));

        // Process layers from youngest to oldest
        for (let layer = maxLayer; layer >= 0; layer--) {
          const layerNodes = layers.get(layer) ?? [];
          if (layerNodes.length === 0) continue;

          type Couple = {
            coupleId: string;
            leftPartnerId: string;
            leftParentsId: string;
            rightPartnerId: string;
            rightParentsId: string;
          };

          // Map parent IDs to their children (solos and couples)
          const solos = new Map<string, string[]>();
          const couples = new Map<string, Couple[]>();
          const placed = new Set<string>();
          const parentIds: string[] = [];

          // Helper to create couple ID
          const coupleId = (id1: string, id2: string) =>
            [id1, id2].sort().join('|');

          // Helper to get parents' couple ID
          const getParentsId = (nodeId: string): string => {
            const parents = getParents(nodeId);
            return parents.sort().join('|');
          };

          // Group nodes by their parents
          for (const nodeId of layerNodes) {
            if (placed.has(nodeId)) continue;

            const partnerId = getPartner(nodeId);

            if (partnerId && layerNodes.includes(partnerId)) {
              // Handle couple
              const node = getNodeById(nodeId);

              // Order couple by gender (female first)
              const [leftId, rightId] =
                node?.sex === 'male'
                  ? [partnerId, nodeId]
                  : [nodeId, partnerId];

              placed.add(nodeId);
              placed.add(partnerId);

              const leftParentsId = getParentsId(leftId);
              const rightParentsId = getParentsId(rightId);
              const effectiveLeftParentsId =
                leftParentsId === '' ? rightParentsId : leftParentsId;
              const effectiveRightParentsId =
                rightParentsId === '' ? leftParentsId : rightParentsId;

              if (!couples.has(effectiveLeftParentsId)) {
                couples.set(effectiveLeftParentsId, []);
              }
              if (!couples.has(effectiveRightParentsId)) {
                couples.set(effectiveRightParentsId, []);
              }

              const coupleData: Couple = {
                coupleId: coupleId(leftId, rightId),
                leftPartnerId: leftId,
                leftParentsId: effectiveLeftParentsId,
                rightPartnerId: rightId,
                rightParentsId: effectiveRightParentsId,
              };

              couples.get(effectiveLeftParentsId)?.push(coupleData);

              // Track parent IDs order
              if (
                parentIds.includes(effectiveRightParentsId) &&
                !parentIds.includes(effectiveLeftParentsId)
              ) {
                const targetIndex = parentIds.indexOf(effectiveRightParentsId);
                parentIds.splice(targetIndex, 0, effectiveLeftParentsId);
              } else if (!parentIds.includes(effectiveLeftParentsId)) {
                parentIds.push(effectiveLeftParentsId);
              }

              if (effectiveRightParentsId !== effectiveLeftParentsId) {
                couples.get(effectiveRightParentsId)?.push(coupleData);
                if (
                  parentIds.includes(effectiveLeftParentsId) &&
                  !parentIds.includes(effectiveRightParentsId)
                ) {
                  const targetIndex = parentIds.indexOf(effectiveLeftParentsId);
                  parentIds.splice(targetIndex + 1, 0, effectiveRightParentsId);
                } else if (!parentIds.includes(effectiveRightParentsId)) {
                  parentIds.push(effectiveRightParentsId);
                }
              }
            } else {
              // Handle solo node
              const parentsId = getParentsId(nodeId);
              if (!solos.has(parentsId)) solos.set(parentsId, []);
              solos.get(parentsId)?.push(nodeId);
              if (!parentIds.includes(parentsId)) parentIds.push(parentsId);
              placed.add(nodeId);
            }
          }

          // Build ordered list based on parent relationships
          const orderedNodes: string[] = [];

          for (const parentId of parentIds) {
            // Add solo children
            orderedNodes.push(...(solos.get(parentId) ?? []));

            // Add all couples
            const couplesForParent = couples.get(parentId) ?? [];
            for (const couple of couplesForParent) {
              if (!orderedNodes.includes(couple.leftPartnerId))
                orderedNodes.push(couple.leftPartnerId);
              if (!orderedNodes.includes(couple.rightPartnerId))
                orderedNodes.push(couple.rightPartnerId);
            }
          }

          // Global side sort (maternal left, neutral center, paternal right)
          orderedNodes.sort((a, b) => {
            const sideOrder = { maternal: -1, neutral: 0, paternal: 1 };
            const sideA = sides.get(a) ?? 'neutral';
            const sideB = sides.get(b) ?? 'neutral';
            return sideOrder[sideA] - sideOrder[sideB];
          });

          layers.set(layer, orderedNodes);
        }

        // Assign coordinates
        const placedNodes = new Set<string>();

        for (let layer = maxLayer; layer >= 0; layer--) {
          const layerNodes = layers.get(layer) ?? [];
          const y = layer * spacing.generations;
          let nextX = 0;

          for (let i = 0; i < layerNodes.length; i++) {
            const nodeId = layerNodes[i];
            if (!nodeId || placedNodes.has(nodeId)) continue;

            const partnerId = getPartner(nodeId);
            if (partnerId && layerNodes.includes(partnerId)) {
              const nodeData = getNodeById(nodeId);

              let leftPartnerId: string;
              let rightPartnerId: string;

              if (nodeData?.isEgo) {
                // ego always on consistent side (e.g., left for male, right for female)
                if (nodeData.sex === 'male') {
                  leftPartnerId = nodeId;
                  rightPartnerId = partnerId;
                } else {
                  leftPartnerId = partnerId;
                  rightPartnerId = nodeId;
                }
              } else {
                // normal couple rule
                leftPartnerId = nodeData?.sex === 'male' ? partnerId : nodeId;
                rightPartnerId = leftPartnerId === nodeId ? partnerId : nodeId;
              }

              const leftExId = getExPartner(leftPartnerId);
              const rightExId = getExPartner(rightPartnerId);

              const sharedChildren = getSharedChildren(
                leftPartnerId,
                rightPartnerId,
              );

              // center the couple around their children, if any
              let centerX: number | undefined;
              if (sharedChildren.length > 0) {
                const childXs = sharedChildren
                  .map((c) => positions.get(c)?.x)
                  .filter((x): x is number => x !== undefined);
                if (childXs.length > 0)
                  centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
              }

              // reserve space for exes
              const leftReserve = leftExId ? spacing.partners : 0;
              const rightReserve = rightExId ? spacing.partners : 0;

              // base placement
              let leftX =
                typeof centerX === 'number'
                  ? centerX - spacing.partners / 2
                  : nextX + leftReserve;
              let rightX = leftX + spacing.partners;

              if (leftX < nextX + leftReserve) {
                const shift = nextX + leftReserve - leftX;
                leftX += shift;
                rightX += shift;
              }

              positions.set(leftPartnerId, { x: leftX, y });
              positions.set(rightPartnerId, { x: rightX, y });
              placedNodes.add(leftPartnerId);
              placedNodes.add(rightPartnerId);

              // ex-partners
              if (leftExId) {
                positions.set(leftExId, { x: leftX - spacing.partners, y });
                placedNodes.add(leftExId);
              }
              if (rightExId) {
                positions.set(rightExId, { x: rightX + spacing.partners, y });
                placedNodes.add(rightExId);
              }

              nextX = rightX + rightReserve + spacing.siblings;
              i++; // skip partner
            } else {
              // single nodes
              const children = getChildren(nodeId);
              const childXs = children
                .map((c) => positions.get(c)?.x)
                .filter((x): x is number => x !== undefined);

              if (childXs.length > 0) {
                const centerX =
                  childXs.reduce((a, b) => a + b, 0) / childXs.length;
                positions.set(nodeId, { x: Math.max(nextX, centerX), y });
                nextX = Math.max(
                  nextX + spacing.siblings,
                  centerX + spacing.siblings,
                );
              } else {
                positions.set(nodeId, { x: nextX, y });
                nextX += spacing.siblings;
              }

              placedNodes.add(nodeId);
            }
          }
        }

        // Normalize coordinates (move leftmost to x=0)
        const allPositions = Array.from(positions.values());
        if (allPositions.length > 0) {
          const minX = Math.min(...allPositions.map((pos) => pos.x));
          if (minX < 0) {
            for (const [nodeId, pos] of Array.from(positions.entries())) {
              positions.set(nodeId, { x: pos.x - minX, y: pos.y });
            }
          }
        }

        return positions;
      };

      const updateReadOnly = (id: string | null) => {
        if (!id) return;
        const node = get().network.nodes.get(id);
        if (!node || node.isEgo) return;
        get().updateNode(id, { readOnly: true });
      };

      // marks both parents of a newly added child node readOnly
      const markParentAndPartnersReadOnly = (parentId: string) => {
        const partnerId = getPartner?.(parentId);
        const exPartnerId = getExPartner?.(parentId);

        updateReadOnly(parentId);
        updateReadOnly(partnerId);
        updateReadOnly(exPartnerId);
      };

      // unlock a parent (and its partner) if they have no children left
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

            // unlock partner (if present)
            const partnerId: string | null = getPartner(parentId);
            if (partnerId) {
              const partnerNode = draft.network.nodes.get(partnerId);
              if (partnerNode && !partnerNode.isEgo) {
                partnerNode.readOnly = false;
              }
            }

            // unlock ex-partner (if present)
            const exPartnerId = getExPartner(parentId);
            if (exPartnerId) {
              const exNode = draft.network.nodes.get(exPartnerId);
              // do not unlock ego parents
              if (
                exNode &&
                typeof exNode.label === 'string' &&
                exNode.label.toLowerCase() !== 'mother' &&
                exNode.label.toLowerCase() !== 'father'
              ) {
                exNode.readOnly = false;
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

          // track potential partners before deletion
          const partnerId = getPartner(id);
          const exPartnerId = getExPartner(id);

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

          maybeDeletePartner(partnerId);
          maybeDeletePartner(exPartnerId);

          get().runLayout();
          get().syncMetadata();
        },

        addEdge: ({ id, source, target, relationship }) => {
          const edgeId = id ?? `${source}-${target}-${relationship}`;
          set((state) => {
            if (state.network.edges.has(edgeId)) {
              return; // Edge already exists
            }
            state.network.edges.set(edgeId, { source, target, relationship });
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

          // Clear existing network
          // store.clearNetwork();

          // Use the existing addNode and addEdge actions
          const { addNode, addEdge, updateNode } = store;

          // Maternal grandparents
          const maternalGrandmotherId = addNode({
            //id: 'maternal-grandmother',
            label: 'maternal grandmother',
            sex: 'female',
            readOnly: true,
          });
          const maternalGrandfatherId = addNode({
            //id: 'maternal-grandfather',
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
            //id: 'paternal-grandmother',
            label: 'paternal grandmother',
            sex: 'female',
            readOnly: true,
          });
          const paternalGrandfatherId = addNode({
            //id: 'paternal-grandfather',
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
            //id: 'mother',
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
            //id: 'father',
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

          // Ego (self)
          /*const egoId = addNode({
            //id: 'ego',
            label: 'self',
            sex: egoSex,
            readOnly: true,
            isEgo: true,
          });*/
          const nodes = get().network.nodes;
          const egoId = Array.from(nodes.entries()).find(
            ([, node]) => node.isEgo,
          )?.[0];
          if (egoId) {
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
          }

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
              //id: 'ego-partner',
              label: "self's partner",
              sex: egoSex === 'female' ? 'male' : 'female',
              readOnly: true,
            });
            addEdge({
              target: egoPartnerId,
              source: egoId,
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

          store.runLayout();
        },

        addPlaceholderNode: (relation: string, anchorId?: string) => {
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
            const rel = relation
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .toLowerCase();

            if (!anchorId || (!rel.includes('aunt') && !rel.includes('uncle')))
              return rel;

            const anchorLabel =
              network.nodes.get(anchorId)?.label?.toLowerCase() ?? '';
            if (anchorLabel.includes('mother')) return `maternal ${rel}`;
            if (anchorLabel.includes('father')) return `paternal ${rel}`;

            return rel;
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
              label: `${node.label}'s partner`,
              sex: partnerSex,
              readOnly: true,
            });

            if (node.isEgo) {
              addEdge({
                source: nodeId,
                target: partnerId,
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

          const ensureExPartner = (nodeId: string): string | null => {
            const node = network.nodes.get(nodeId);
            if (!node) return null;

            // Check if an ex-partner already exists
            for (const [, edge] of network.edges) {
              if (
                edge.relationship === 'ex-partner' &&
                (edge.source === nodeId || edge.target === nodeId)
              ) {
                return edge.source === nodeId ? edge.target : edge.source;
              }
            }

            // Otherwise create a new ex-partner
            const exPartnerSex = node.sex === 'male' ? 'female' : 'male';
            const exPartnerId = addNode({
              label: `${node.label}'s ex-partner`,
              sex: exPartnerSex,
              readOnly: true,
            });

            addEdge({
              source: node.sex === 'male' ? exPartnerId : nodeId,
              target: node.sex === 'male' ? nodeId : exPartnerId,
              relationship: 'ex-partner',
            });

            return exPartnerId;
          };

          const connectAsChild = (parentId: string) => {
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

          // half siblings
          if (rel.includes('half')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`half relation requires anchorId`);
              return newNodeId;
            }
            const exPartnerId = ensureExPartner(anchorId);
            if (exPartnerId) connectAsChild(exPartnerId);
            connectAsChild(anchorId);
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

          // nieces and nephews (child of ego’s sibling)
          else if (rel.includes('niece') || rel.includes('nephew')) {
            if (!anchorId) {
              // eslint-disable-next-line no-console
              console.warn(`Niece/nephew relation requires anchorId`);
              return newNodeId;
            }
            const partnerId = ensurePartner(anchorId);
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
            const partnerId = ensurePartner(anchorId);
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
            const partnerId = ensurePartner(anchorId);
            connectAsChild(anchorId);
            if (partnerId) connectAsChild(partnerId);
          }

          // aunt/uncle
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
          const positions = runFamilyTreeLayout();

          // Update node positions in the store
          set((draft) => {
            for (const [nodeId, position] of Array.from(positions.entries())) {
              const node = draft.network.nodes.get(nodeId);
              if (node) {
                node.x = position.x;
                node.y = position.y;
              }
            }
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
