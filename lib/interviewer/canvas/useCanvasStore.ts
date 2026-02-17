import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { clamp } from 'es-toolkit';
import { createStore, useStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import { type AppDispatch } from '~/lib/interviewer/store';

type Position = { x: number; y: number };
type CanvasDimensions = { width: number; height: number };

// Minimum gap (px) between a node's visible edge and the canvas boundary.
const EDGE_PADDING = 16;
// Node radius: size-24 = 6rem = 96px → 48px
const NODE_RADIUS = 48;

type CanvasState = {
  positions: Map<string, Position>;
  selectedNodeId: string | null;
  canvasDimensions: CanvasDimensions | null;
};

type CanvasActions = {
  setPosition: (nodeId: string, position: Position) => void;
  setBatchPositions: (entries: [string, Position][]) => void;
  setCanvasDimensions: (dimensions: CanvasDimensions) => void;
  syncFromNodes: (nodes: NcNode[], layoutVariable: string) => void;
  syncNewFromNodes: (nodes: NcNode[], layoutVariable: string) => void;
  selectNode: (nodeId: string | null) => void;
  syncToRedux: (dispatch: AppDispatch, layoutVariable: string) => void;
};

type CanvasStore = CanvasState & CanvasActions;

const clampPosition = (
  pos: Position,
  dimensions: CanvasDimensions | null,
): Position => {
  if (!dimensions || dimensions.width === 0 || dimensions.height === 0) {
    return { x: clamp(pos.x, 0, 1), y: clamp(pos.y, 0, 1) };
  }

  const inset = NODE_RADIUS + EDGE_PADDING;
  const marginX = Math.min(inset / dimensions.width, 0.5);
  const marginY = Math.min(inset / dimensions.height, 0.5);

  return {
    x: clamp(pos.x, marginX, 1 - marginX),
    y: clamp(pos.y, marginY, 1 - marginY),
  };
};

export const createCanvasStore = () =>
  createStore<CanvasStore>()(
    subscribeWithSelector((set, get) => ({
      positions: new Map(),
      selectedNodeId: null,
      canvasDimensions: null,

      setPosition: (nodeId, position) => {
        set((state) => {
          const next = new Map(state.positions);
          next.set(nodeId, clampPosition(position, state.canvasDimensions));
          return { positions: next };
        });
      },

      setBatchPositions: (entries) => {
        set((state) => {
          const next = new Map(state.positions);
          for (const [nodeId, position] of entries) {
            next.set(nodeId, clampPosition(position, state.canvasDimensions));
          }
          return { positions: next };
        });
      },

      setCanvasDimensions: (dimensions) => {
        set((state) => {
          const next = new Map<string, Position>();
          for (const [nodeId, pos] of state.positions) {
            next.set(nodeId, clampPosition(pos, dimensions));
          }
          return { canvasDimensions: dimensions, positions: next };
        });
      },

      syncFromNodes: (nodes, layoutVariable) => {
        const dims = get().canvasDimensions;
        const next = new Map<string, Position>();
        for (const node of nodes) {
          const attrs = node[entityAttributesProperty];
          const layoutValue = attrs[layoutVariable] as
            | Position
            | null
            | undefined;
          if (
            layoutValue &&
            typeof layoutValue.x === 'number' &&
            typeof layoutValue.y === 'number'
          ) {
            next.set(
              node[entityPrimaryKeyProperty],
              clampPosition(layoutValue, dims),
            );
          }
        }
        set({ positions: next });
      },

      // Only add positions for new nodes and remove stale ones.
      // Preserves existing positions managed by the force simulation.
      syncNewFromNodes: (nodes, layoutVariable) => {
        set((state) => {
          const next = new Map(state.positions);
          const currentNodeIds = new Set(
            nodes.map((n) => n[entityPrimaryKeyProperty]),
          );

          for (const nodeId of next.keys()) {
            if (!currentNodeIds.has(nodeId)) {
              next.delete(nodeId);
            }
          }

          for (const node of nodes) {
            const nodeId = node[entityPrimaryKeyProperty];
            if (!next.has(nodeId)) {
              const attrs = node[entityAttributesProperty];
              const layoutValue = attrs[layoutVariable] as
                | Position
                | null
                | undefined;
              if (
                layoutValue &&
                typeof layoutValue.x === 'number' &&
                typeof layoutValue.y === 'number'
              ) {
                next.set(
                  nodeId,
                  clampPosition(layoutValue, state.canvasDimensions),
                );
              }
            }
          }

          return { positions: next };
        });
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      syncToRedux: (dispatch, layoutVariable) => {
        const { positions } = get();
        for (const [nodeId, position] of positions) {
          void dispatch(
            updateNode({
              nodeId,
              newAttributeData: {
                [layoutVariable]: { x: position.x, y: position.y },
              },
            }),
          );
        }
      },
    })),
  );

export type CanvasStoreApi = ReturnType<typeof createCanvasStore>;

export function useCanvasStore<T>(
  store: CanvasStoreApi,
  selector: (state: CanvasStore) => T,
): T {
  return useStore(store, selector);
}
