import { invariant } from 'es-toolkit';
import { enableMapSet } from 'immer';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const FAMILY_TREE_CONFIG = {
  nodeContainerWidth: 180,
  nodeContainerHeight: 180,
  nodeWidth: 80,
  nodeHeight: 80,
  padding: 40,
  get rowHeight() {
    return this.nodeContainerHeight + this.padding;
  },
  get siblingSpacing() {
    // Controls padding between siblings
    return this.nodeContainerWidth;
  },
  get partnerSpacing() {
    return this.nodeContainerWidth;
  },
};

enableMapSet();

type Gender = 'male' | 'female';

type Node = {
  id?: string;
  label: string;
  gender: Gender;
  readOnly?: boolean;
  isEgo?: boolean;
  x?: number;
  y?: number;
};

type Edge = {
  id?: string;
  source: string;
  target: string;
  relationship: 'parent' | 'partner' | 'ex-partner';
};

type NetworkState = {
  nodes: Map<string, Omit<Node, 'id'>>;
  edges: Map<string, Omit<Edge, 'id'>>;
};

type FamilyTreeState = {
  step: number;
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
  getNetworkAsObject: () => { nodes: Node[]; edges: Edge[] };
  runLayout: () => void;
};

type FamilyTreeAction = {
  setStep: (step: number) => void;
} & NetworkActions;

const initialState: FamilyTreeState = {
  step: 0,
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

      const getChildren = (nodeId: string): string[] => {
        const edges = get().network.edges;
        const children: string[] = [];
        for (const [, edge] of Array.from(edges.entries())) {
          if (edge.relationship === 'parent' && edge.source === nodeId) {
            children.push(edge.target);
          }
        }
        return children;
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

        // Ensure partners are on the same layer
        for (const [nodeId] of Array.from(nodes.entries())) {
          const partnerId = getPartner(nodeId);
          if (partnerId) {
            const nodeLayer = nodeToLayer.get(nodeId);
            const partnerLayer = nodeToLayer.get(partnerId);

            if (
              nodeLayer !== undefined &&
              partnerLayer !== undefined &&
              nodeLayer !== partnerLayer
            ) {
              const targetLayer = Math.max(nodeLayer, partnerLayer);

              // Move both to the deeper layer
              [nodeId, partnerId].forEach((id) => {
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

        // Order nodes within each layer
        const maxLayer = Math.max(...Array.from(layers.keys()));

        for (let layer = maxLayer; layer >= 0; layer--) {
          const layerNodes = layers.get(layer) ?? [];
          if (layerNodes.length === 0) continue;

          // Group couples and singles
          const placed = new Set<string>();
          const orderedNodes: string[] = [];

          // Place couples first, then singles
          for (const nodeId of layerNodes) {
            if (placed.has(nodeId)) continue;

            const partnerId = getPartner(nodeId);
            if (partnerId && layerNodes.includes(partnerId)) {
              // Place couple (female first by convention)
              const node = getNodeById(nodeId);

              if (node?.gender === 'female') {
                orderedNodes.push(nodeId, partnerId);
              } else {
                orderedNodes.push(partnerId, nodeId);
              }
              placed.add(nodeId);
              placed.add(partnerId);
            } else {
              orderedNodes.push(nodeId);
              placed.add(nodeId);
            }
          }

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
              // Handle couple
              const sharedChildren = getSharedChildren(nodeId, partnerId);

              if (sharedChildren.length > 0) {
                // Place parents over children
                const childXPositions = sharedChildren
                  .map((childId) => positions.get(childId)?.x)
                  .filter((x): x is number => x !== undefined);

                if (childXPositions.length > 0) {
                  const centerX =
                    childXPositions.reduce((a, b) => a + b, 0) /
                    childXPositions.length;
                  let leftX = centerX - spacing.partners / 2;
                  let rightX = centerX + spacing.partners / 2;

                  // Adjust positions if they conflict with nextX
                  if (nextX > 0) {
                    leftX = Math.max(nextX, leftX);
                    rightX = Math.max(nextX + spacing.partners, rightX);
                  }

                  positions.set(nodeId, { x: leftX, y });
                  positions.set(partnerId, { x: rightX, y });
                  nextX = rightX + spacing.siblings;
                } else {
                  // No children positioned yet
                  positions.set(nodeId, { x: nextX, y });
                  positions.set(partnerId, { x: nextX + spacing.partners, y });
                  nextX = nextX + spacing.partners + spacing.siblings;
                }
              } else {
                // Couple with no children
                positions.set(nodeId, { x: nextX, y });
                positions.set(partnerId, { x: nextX + spacing.partners, y });
                nextX = nextX + spacing.partners + spacing.siblings;
              }

              placedNodes.add(nodeId);
              placedNodes.add(partnerId);
              i++; // Skip partner in next iteration
            } else {
              // Single node
              const children = getChildren(nodeId);

              if (children.length > 0) {
                // Position over children if they exist
                const childXPositions = children
                  .map((childId) => positions.get(childId)?.x)
                  .filter((x): x is number => x !== undefined);

                if (childXPositions.length > 0) {
                  const centerX =
                    childXPositions.reduce((a, b) => a + b, 0) /
                    childXPositions.length;
                  positions.set(nodeId, { x: Math.max(nextX, centerX), y });
                  nextX = Math.max(
                    nextX + spacing.siblings,
                    centerX + spacing.siblings,
                  );
                } else {
                  positions.set(nodeId, { x: nextX, y });
                  nextX += spacing.siblings;
                }
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
          gender,
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
              gender,
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
            gender: 'female',
            readOnly: true,
          });
          addNode({
            id: 'maternal-grandfather',
            label: 'maternal grandfather',
            gender: 'male',
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
            gender: 'female',
            readOnly: true,
          });
          addNode({
            id: 'paternal-grandfather',
            label: 'paternal grandfather',
            gender: 'male',
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
            gender: 'female',
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
            gender: 'male',
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
            gender: 'female',
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
              gender: 'male',
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
              gender: 'female',
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
              gender: 'male', // TODO: Make dynamic based on user input
              readOnly: true,
            });
            addEdge({
              source: 'ego',
              target: egoPartnerId,
              relationship: 'partner',
            });

            arrayFromRelationCount(formData, 'sons').forEach(() => {
              const sonId = addNode({
                label: 'son',
                gender: 'male',
                readOnly: true,
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
                gender: 'female',
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
              gender: 'male',
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
              gender: 'female',
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
              gender: 'male',
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
              gender: 'female',
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

        getNetworkAsObject: () => {
          const state = get();

          // Create new arrays and cache them
          const nodes = Array.from(state.network.nodes.entries()).map(
            ([id, node]) => ({
              id,
              ...node,
            }),
          );

          const edges = Array.from(state.network.edges.entries()).map(
            ([id, edge]) => ({
              id,
              ...edge,
            }),
          );

          return {
            nodes,
            edges,
          };
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
