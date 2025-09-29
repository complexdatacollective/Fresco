import { NcEdge, NcNode } from '@codaco/shared-consts';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type NodeId = string;
export type EdgeId = string;

export type FamilyTreeNode = {
  id: NodeId;
  isEgo: boolean;
  committed: boolean;
  _node?: NcNode;
};

export type RelationshipType =
  | 'parent_child'
  | 'partnership'
  | 'ex_partnership';

export type FamilyTreeEdge = {
  id: EdgeId;
  type: RelationshipType;
  committed: boolean;
  source: NodeId;
  target: NodeId;
  _edge?: NcEdge;
};

export type FamilyTreeGraph = {
  nodes: Map<NodeId, FamilyTreeNode>;
  edges: Map<EdgeId, FamilyTreeEdge>;
  adjacencyList: Map<NodeId, Set<EdgeId>>;
};

type FamilyTreeState = {
  step: number;
  graph: FamilyTreeGraph;
};

type GraphMutations = {
  addNode: (node: FamilyTreeNode) => void;
  updateNode: (
    id: NodeId,
    updates: Partial<Omit<FamilyTreeNode, 'id'>>,
  ) => void;
  removeNode: (id: NodeId) => void;
  addEdge: (edge: FamilyTreeEdge) => void;
  updateEdge: (
    id: EdgeId,
    updates: Partial<Omit<FamilyTreeEdge, 'id' | 'source' | 'target'>>,
  ) => void;
  removeEdge: (id: EdgeId) => void;
  commitNode: (id: NodeId) => void;
  commitEdge: (id: EdgeId) => void;
  batchCommit: (nodeIds: NodeId[], edgeIds: EdgeId[]) => void;
};

type GraphQueries = {
  getNode: (id: NodeId) => FamilyTreeNode | undefined;
  getEdge: (id: EdgeId) => FamilyTreeEdge | undefined;
  getNodeEdges: (nodeId: NodeId) => FamilyTreeEdge[];
  getNeighbors: (nodeId: NodeId) => FamilyTreeNode[];
  getChildren: (nodeId: NodeId) => FamilyTreeNode[];
  getParents: (nodeId: NodeId) => FamilyTreeNode[];
  getPartners: (nodeId: NodeId, includeEx?: boolean) => FamilyTreeNode[];
  findPath: (sourceId: NodeId, targetId: NodeId) => NodeId[] | null;
  getConnectedComponent: (nodeId: NodeId) => Set<NodeId>;
  getAllNodes: () => FamilyTreeNode[];
  getAllEdges: () => FamilyTreeEdge[];
  getUncommittedNodes: () => FamilyTreeNode[];
  getUncommittedEdges: () => FamilyTreeEdge[];
};

type FamilyTreeActions = {
  setStep: (step: number) => void;
  resetGraph: () => void;
};

const createEmptyGraph = (): FamilyTreeGraph => ({
  nodes: new Map(),
  edges: new Map(),
  adjacencyList: new Map(),
});

const initialState: FamilyTreeState = {
  step: 0,
  graph: createEmptyGraph(),
};

export type FamilyTreeStore = FamilyTreeState &
  GraphMutations &
  GraphQueries &
  FamilyTreeActions;

export const createFamilyTreeStore = (init?: Partial<FamilyTreeState>) => {
  return createStore<FamilyTreeStore>()(
    immer((set, get) => ({
      ...initialState,
      ...init,

      // Graph Mutations
      addNode: (node) =>
        set((state) => {
          state.graph.nodes.set(node.id, node);
          if (!state.graph.adjacencyList.has(node.id)) {
            state.graph.adjacencyList.set(node.id, new Set());
          }
        }),

      updateNode: (id, updates) =>
        set((state) => {
          const node = state.graph.nodes.get(id);
          if (node) {
            state.graph.nodes.set(id, { ...node, ...updates });
          }
        }),

      removeNode: (id) =>
        set((state) => {
          // Remove node
          state.graph.nodes.delete(id);

          // Remove all edges connected to this node
          const edgesToRemove = state.graph.adjacencyList.get(id) || new Set();
          edgesToRemove.forEach((edgeId) => {
            const edge = state.graph.edges.get(edgeId);
            if (edge) {
              // Remove edge from other node's adjacency list
              const otherId = edge.source === id ? edge.target : edge.source;
              state.graph.adjacencyList.get(otherId)?.delete(edgeId);
              // Remove edge
              state.graph.edges.delete(edgeId);
            }
          });

          // Remove from adjacency list
          state.graph.adjacencyList.delete(id);
        }),

      addEdge: (edge) =>
        set((state) => {
          state.graph.edges.set(edge.id, edge);

          // Update adjacency lists
          if (!state.graph.adjacencyList.has(edge.source)) {
            state.graph.adjacencyList.set(edge.source, new Set());
          }
          if (!state.graph.adjacencyList.has(edge.target)) {
            state.graph.adjacencyList.set(edge.target, new Set());
          }
          state.graph.adjacencyList.get(edge.source)?.add(edge.id);
          state.graph.adjacencyList.get(edge.target)?.add(edge.id);
        }),

      updateEdge: (id, updates) =>
        set((state) => {
          const edge = state.graph.edges.get(id);
          if (edge) {
            state.graph.edges.set(id, { ...edge, ...updates });
          }
        }),

      removeEdge: (id) =>
        set((state) => {
          const edge = state.graph.edges.get(id);
          if (edge) {
            // Remove from adjacency lists
            state.graph.adjacencyList.get(edge.source)?.delete(id);
            state.graph.adjacencyList.get(edge.target)?.delete(id);
            // Remove edge
            state.graph.edges.delete(id);
          }
        }),

      commitNode: (id) =>
        set((state) => {
          const node = state.graph.nodes.get(id);
          if (node) {
            state.graph.nodes.set(id, { ...node, committed: true });
          }
        }),

      commitEdge: (id) =>
        set((state) => {
          const edge = state.graph.edges.get(id);
          if (edge) {
            state.graph.edges.set(id, { ...edge, committed: true });
          }
        }),

      batchCommit: (nodeIds, edgeIds) =>
        set((state) => {
          nodeIds.forEach((id) => {
            const node = state.graph.nodes.get(id);
            if (node) {
              state.graph.nodes.set(id, { ...node, committed: true });
            }
          });
          edgeIds.forEach((id) => {
            const edge = state.graph.edges.get(id);
            if (edge) {
              state.graph.edges.set(id, { ...edge, committed: true });
            }
          });
        }),

      // Graph Queries
      getNode: (id) => {
        return get().graph.nodes.get(id);
      },

      getEdge: (id) => {
        return get().graph.edges.get(id);
      },

      getNodeEdges: (nodeId) => {
        const edgeIds = get().graph.adjacencyList.get(nodeId) || new Set();
        return Array.from(edgeIds)
          .map((id) => get().graph.edges.get(id))
          .filter((edge): edge is FamilyTreeEdge => edge !== undefined);
      },

      getNeighbors: (nodeId) => {
        const edges = get().getNodeEdges(nodeId);
        const neighborIds = new Set<NodeId>();
        edges.forEach((edge) => {
          neighborIds.add(edge.source === nodeId ? edge.target : edge.source);
        });
        return Array.from(neighborIds)
          .map((id) => get().graph.nodes.get(id))
          .filter((node): node is FamilyTreeNode => node !== undefined);
      },

      getChildren: (nodeId) => {
        const edges = get().getNodeEdges(nodeId);
        const childIds = edges
          .filter(
            (edge) => edge.type === 'parent_child' && edge.source === nodeId,
          )
          .map((edge) => edge.target);
        return childIds
          .map((id) => get().graph.nodes.get(id))
          .filter((node): node is FamilyTreeNode => node !== undefined);
      },

      getParents: (nodeId) => {
        const edges = get().getNodeEdges(nodeId);
        const parentIds = edges
          .filter(
            (edge) => edge.type === 'parent_child' && edge.target === nodeId,
          )
          .map((edge) => edge.source);
        return parentIds
          .map((id) => get().graph.nodes.get(id))
          .filter((node): node is FamilyTreeNode => node !== undefined);
      },

      getPartners: (nodeId, includeEx = false) => {
        const edges = get().getNodeEdges(nodeId);
        const partnerTypes: RelationshipType[] = includeEx
          ? ['partnership', 'ex_partnership']
          : ['partnership'];
        const partnerIds = edges
          .filter((edge) => partnerTypes.includes(edge.type))
          .map((edge) => (edge.source === nodeId ? edge.target : edge.source));
        return partnerIds
          .map((id) => get().graph.nodes.get(id))
          .filter((node): node is FamilyTreeNode => node !== undefined);
      },

      findPath: (sourceId, targetId) => {
        const visited = new Set<NodeId>();
        const queue: { id: NodeId; path: NodeId[] }[] = [
          { id: sourceId, path: [sourceId] },
        ];

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current.id === targetId) {
            return current.path;
          }

          if (visited.has(current.id)) continue;
          visited.add(current.id);

          const neighbors = get().getNeighbors(current.id);
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
              queue.push({
                id: neighbor.id,
                path: [...current.path, neighbor.id],
              });
            }
          }
        }

        return null;
      },

      getConnectedComponent: (nodeId) => {
        const visited = new Set<NodeId>();
        const stack = [nodeId];

        while (stack.length > 0) {
          const current = stack.pop()!;
          if (visited.has(current)) continue;
          visited.add(current);

          const neighbors = get().getNeighbors(current);
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
              stack.push(neighbor.id);
            }
          }
        }

        return visited;
      },

      getAllNodes: () => {
        return Array.from(get().graph.nodes.values());
      },

      getAllEdges: () => {
        return Array.from(get().graph.edges.values());
      },

      getUncommittedNodes: () => {
        return Array.from(get().graph.nodes.values()).filter(
          (node) => !node.committed,
        );
      },

      getUncommittedEdges: () => {
        return Array.from(get().graph.edges.values()).filter(
          (edge) => !edge.committed,
        );
      },

      // Actions
      setStep: (step) =>
        set((state) => {
          state.step = step;
        }),

      resetGraph: () =>
        set((state) => {
          state.graph = createEmptyGraph();
        }),
    })),
  );
};

export type FamilyTreeStoreApi = ReturnType<typeof createFamilyTreeStore>;
