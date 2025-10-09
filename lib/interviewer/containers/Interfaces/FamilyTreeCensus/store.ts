import { invariant } from 'es-toolkit';
import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { FAMILY_TREE_CONFIG } from './config';

enableMapSet();

type Sex = 'male' | 'female';

export type Node = {
  id?: string;
  name?: string;
  label: string;
  sex: Sex;
  readOnly?: boolean;
  isEgo?: boolean;
  interviewNetworkId?: string;
  x?: number;
  y?: number;
};

export type Edge = {
  id?: string;
  interviewNetworkId?: string;
  source: string;
  target: string;
  relationship: 'parent' | 'partner' | 'ex-partner';
};

type NetworkState = {
  nodes: Map<string, Omit<Node, 'id'>>;
  edges: Map<string, Omit<Edge, 'id'>>;
};

type FamilyTreeState = {
  step: 'scaffoldingStep' | 'nameGenerationStep' | 'diseaseNominationStep';
  network: NetworkState;
};

type NetworkActions = {
  addNode: (node: Omit<Node, 'id'> & { id?: string }) => string;
  updateNode: (id: string, updates: Partial<Omit<Node, 'id'>>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<Edge, 'id'> & { id?: string }) => string | undefined;
  removeEdge: (id: string) => void;
  clearNetwork: () => void;
  generatePlaceholderNetwork: (formData: Record<string, number>) => void;
  addPlaceholderNode: (formData) => void;
  runLayout: () => void;
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

export const createFamilyTreeStore = (init: FamilyTreeState = initialState) => {
  return createStore<FamilyTreeStore>()(
    immer((set, get) => {
      // Network traversal utilities
      const getNodeById = (id: string) => get().network.nodes.get(id);

      const getPartner = (nodeId: string): string | null => {
        const edges = get().network.edges;
        for (const [, edge] of Array.from(edges.entries())) {
          if (edge.relationship === 'partner') {
            if (edge.source === nodeId) return edge.target;
            if (edge.target === nodeId) return edge.source;
          }
        }
        return null;
      };

      const getExPartner = (nodeId: string): string | null => {
        const edges = get().network.edges;
        for (const [, edge] of Array.from(edges.entries())) {
          if (edge.relationship === 'ex-partner') {
            if (edge.source === nodeId) return edge.target;
            if (edge.target === nodeId) return edge.source;
          }
        }
        return null;
      };

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

        // Order nodes within each layer based on family relationships
        const maxLayer = Math.max(...Array.from(layers.keys()));

        // Track parent couple IDs from the previous (younger) layer
        let lastLevelParentIds = new Set<string>();

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
          const placedCouples = new Set<string>();
          const orderedParentIds = new Set<string>();

          for (const parentId of parentIds) {
            // Add solo children first
            orderedNodes.push(...(solos.get(parentId) ?? []));
            orderedParentIds.add(parentId);

            // Add couples in order corresponding to their children's order
            let relatedCouples = couples.get(parentId) ?? [];

            // Place couples that match the order from the children's layer
            for (const coupleIdFromChild of lastLevelParentIds) {
              const matchedCouples = relatedCouples.filter(
                (couple) => couple.coupleId === coupleIdFromChild,
              );

              for (const couple of matchedCouples) {
                if (placedCouples.has(couple.coupleId)) continue;
                orderedNodes.push(couple.leftPartnerId, couple.rightPartnerId);
                placedCouples.add(couple.coupleId);
                orderedParentIds.add(couple.leftParentsId);
                orderedParentIds.add(couple.rightParentsId);
              }

              // Keep only unplaced couples
              relatedCouples = relatedCouples.filter(
                (couple) =>
                  couple.coupleId !== coupleIdFromChild &&
                  !placedCouples.has(couple.coupleId),
              );
            }

            // Add remaining couples (those without children)
            for (const couple of relatedCouples) {
              if (placedCouples.has(couple.coupleId)) continue;

              // Find first sibling position
              const targetIndex = orderedNodes.findIndex((nodeId) => {
                const parentsId = getParentsId(nodeId);
                return (
                  parentsId === couple.leftParentsId ||
                  parentsId === couple.rightParentsId
                );
              });

              if (targetIndex > -1) {
                // Check if sibling has partner to the left
                const siblingId = orderedNodes[targetIndex];
                const prevNodeId = orderedNodes[targetIndex - 1];
                const prevPartner = prevNodeId ? getPartner(prevNodeId) : null;

                if (prevPartner === siblingId) {
                  // Insert after the sibling couple
                  orderedNodes.splice(
                    targetIndex + 1,
                    0,
                    couple.leftPartnerId,
                    couple.rightPartnerId,
                  );
                } else {
                  // Insert before the sibling
                  orderedNodes.splice(
                    targetIndex,
                    0,
                    couple.leftPartnerId,
                    couple.rightPartnerId,
                  );
                }
              } else {
                // Add at the end
                orderedNodes.push(couple.leftPartnerId, couple.rightPartnerId);
              }

              placedCouples.add(couple.coupleId);
              orderedParentIds.add(couple.leftParentsId);
            }
          }

          lastLevelParentIds = orderedParentIds;
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

              // canonical couple (female left, male right)
              const leftPartnerId =
                nodeData?.sex === 'male' ? partnerId : nodeId;
              const rightPartnerId =
                leftPartnerId === nodeId ? partnerId : nodeId;

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

      return {
        ...init,

        setStep: (step) =>
          set((state) => {
            state.step = step;
          }),

        addNode: ({
          id = crypto.randomUUID(),
          label,
          sex,
          readOnly = false,
          isEgo = false,
          x,
          y,
        }) => {
          set((state) => {
            invariant(
              !state.network.nodes.has(id),
              `Node with ID ${id} already exists`,
            );
            state.network.nodes.set(id, {
              label,
              sex,
              readOnly,
              isEgo,
              x,
              y,
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

        // TODO: add back in the functionality where deleting all children removes
        // read only from non blood partner/ex-partner
        removeNode: (id) => {
          set((state) => {
            state.network.nodes.delete(id);
            // Remove all edges connected to this node
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
          const store = get();

          store.runLayout();
        },

        addEdge: ({ id, source, target, relationship }) => {
          const edgeId = id ?? `${source}-${target}-${relationship}`;
          set((state) => {
            if (state.network.edges.has(edgeId)) {
              return; // Edge already exists
            }
            state.network.edges.set(edgeId, { source, target, relationship });
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

        generatePlaceholderNetwork: (formData) => {
          const store = get();

          // Clear existing network
          store.clearNetwork();

          // Use the existing addNode and addEdge actions
          const { addNode, addEdge } = store;

          // Maternal grandparents
          addNode({
            id: 'maternal-grandmother',
            label: 'maternal grandmother',
            sex: 'female',
            readOnly: true,
          });
          addNode({
            id: 'maternal-grandfather',
            label: 'maternal grandfather',
            sex: 'male',
            readOnly: true,
          });
          addEdge({
            source: 'maternal-grandfather',
            target: 'maternal-grandmother',
            relationship: 'partner',
          });

          // Paternal grandparents
          addNode({
            id: 'paternal-grandmother',
            label: 'paternal grandmother',
            sex: 'female',
            readOnly: true,
          });
          addNode({
            id: 'paternal-grandfather',
            label: 'paternal grandfather',
            sex: 'male',
            readOnly: true,
          });
          addEdge({
            source: 'paternal-grandfather',
            target: 'paternal-grandmother',
            relationship: 'partner',
          });

          // Mother
          addNode({
            id: 'mother',
            label: 'mother',
            sex: 'female',
            readOnly: true,
          });
          addEdge({
            source: 'maternal-grandfather',
            target: 'mother',
            relationship: 'parent',
          });
          addEdge({
            source: 'maternal-grandmother',
            target: 'mother',
            relationship: 'parent',
          });

          // Father
          addNode({
            id: 'father',
            label: 'father',
            sex: 'male',
            readOnly: true,
          });
          addEdge({
            source: 'paternal-grandfather',
            target: 'father',
            relationship: 'parent',
          });
          addEdge({
            source: 'paternal-grandmother',
            target: 'father',
            relationship: 'parent',
          });
          addEdge({
            source: 'father',
            target: 'mother',
            relationship: 'partner',
          });

          // Ego (self)
          addNode({
            id: 'ego',
            label: 'self',
            sex: 'female',
            readOnly: true,
            isEgo: true,
          }); // TODO: Make dynamic based on user input
          addEdge({
            source: 'father',
            target: 'ego',
            relationship: 'parent',
          });
          addEdge({
            source: 'mother',
            target: 'ego',
            relationship: 'parent',
          });

          // Add siblings
          arrayFromRelationCount(formData, 'brothers').forEach(() => {
            const brotherId = addNode({
              label: 'brother',
              sex: 'male',
              readOnly: false,
            });
            addEdge({
              source: 'father',
              target: brotherId,
              relationship: 'parent',
            });
            addEdge({
              source: 'mother',
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
              source: 'father',
              target: sisterId,
              relationship: 'parent',
            });
            addEdge({
              source: 'mother',
              target: sisterId,
              relationship: 'parent',
            });
          });

          // Ego's children and partner
          if ((formData.sons ?? 0) > 0 || (formData.daughters ?? 0) > 0) {
            const egoPartnerId = addNode({
              id: 'ego-partner',
              label: "self's partner",
              sex: 'male', // TODO: Make dynamic based on user input
              readOnly: true,
            });
            addEdge({
              target: 'ego',
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
                source: 'ego',
                target: sonId,
                relationship: 'parent',
              });
              addEdge({
                source: 'ego-partner',
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
                source: 'ego',
                target: daughterId,
                relationship: 'parent',
              });
              addEdge({
                source: 'ego-partner',
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
              source: 'paternal-grandfather',
              target: uncleId,
              relationship: 'parent',
            });
            addEdge({
              source: 'paternal-grandmother',
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
              source: 'paternal-grandfather',
              target: auntId,
              relationship: 'parent',
            });
            addEdge({
              source: 'paternal-grandmother',
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
              source: 'maternal-grandfather',
              target: uncleId,
              relationship: 'parent',
            });
            addEdge({
              source: 'maternal-grandmother',
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
              source: 'maternal-grandfather',
              target: auntId,
              relationship: 'parent',
            });
            addEdge({
              source: 'maternal-grandmother',
              target: auntId,
              relationship: 'parent',
            });
          });

          store.runLayout();
        },

        addPlaceholderNode: (relation: string, anchorId?: string) => {
          const store = get();
          const { addNode, addEdge, network } = store;

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

            addEdge({
              source: node.sex === 'female' ? partnerId : nodeId,
              target: node.sex === 'female' ? nodeId : partnerId,
              relationship: 'partner',
            });

            return partnerId;
          };

          const ensureExPartner = (nodeId: string): string | null => {
            const node = network.nodes.get(nodeId);
            console.log(nodeId);
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

          const sex = inferSex(relation);
          const newNodeId = addNode({
            label: relation,
            sex,
            readOnly: false,
          });

          const rel = relation.toLowerCase();

          // half siblings
          if (rel.includes('half')) {
            if (!anchorId) {
              console.warn(`half relation requires anchorId`);
              return newNodeId;
            }
            const exPartnerId = ensureExPartner(anchorId);
            if (exPartnerId) connectAsChild(exPartnerId);
            connectAsChild(anchorId);
          }

          // ego’s children
          else if (rel === 'son' || rel === 'daughter') {
            const egoId = 'ego';
            if (network.nodes.has(egoId)) {
              const partnerId = ensurePartner(egoId);
              connectAsChild(egoId);
              if (partnerId) connectAsChild(partnerId);
            }
          }

          // siblings (brother, sister)
          else if (rel.includes('brother') || rel.includes('sister')) {
            // always connect to both parents
            if (network.nodes.has('mother')) connectAsChild('mother');
            if (network.nodes.has('father')) connectAsChild('father');
          }

          // nieces and nephews (child of ego’s sibling)
          else if (rel.includes('niece') || rel.includes('nephew')) {
            if (!anchorId) {
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
      };
    }),
  );
};

export type FamilyTreeStoreApi = ReturnType<typeof createFamilyTreeStore>;
