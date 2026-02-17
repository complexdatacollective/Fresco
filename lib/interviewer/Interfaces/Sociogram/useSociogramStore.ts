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

type SociogramState = {
  positions: Map<string, Position>;
  selectedNodeId: string | null;
};

type SociogramActions = {
  setPosition: (nodeId: string, position: Position) => void;
  setBatchPositions: (entries: [string, Position][]) => void;
  syncFromNodes: (nodes: NcNode[], layoutVariable: string) => void;
  selectNode: (nodeId: string | null) => void;
  syncToRedux: (dispatch: AppDispatch, layoutVariable: string) => void;
};

type SociogramStore = SociogramState & SociogramActions;

const clampPosition = (pos: Position): Position => ({
  x: clamp(pos.x, 0, 1),
  y: clamp(pos.y, 0, 1),
});

export const createSociogramStore = () =>
  createStore<SociogramStore>()(
    subscribeWithSelector((set, get) => ({
      positions: new Map(),
      selectedNodeId: null,

      setPosition: (nodeId, position) => {
        set((state) => {
          const next = new Map(state.positions);
          next.set(nodeId, clampPosition(position));
          return { positions: next };
        });
      },

      setBatchPositions: (entries) => {
        set((state) => {
          const next = new Map(state.positions);
          for (const [nodeId, position] of entries) {
            next.set(nodeId, clampPosition(position));
          }
          return { positions: next };
        });
      },

      syncFromNodes: (nodes, layoutVariable) => {
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
              clampPosition(layoutValue),
            );
          }
        }
        set({ positions: next });
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

export type SociogramStoreApi = ReturnType<typeof createSociogramStore>;

export function useSociogramStore<T>(
  store: SociogramStoreApi,
  selector: (state: SociogramStore) => T,
): T {
  return useStore(store, selector);
}
