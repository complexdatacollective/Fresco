import { subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { type DragItem, type DropTarget } from './types';

// Extended drop target with state
type DropTargetWithState = DropTarget & {
  canDrop: boolean;
  isOver: boolean;
};

// State types
type DndState = {
  dragItem: DragItem | null;
  dragPosition: { x: number; y: number; width: number; height: number } | null;
  dragPreview: React.ReactNode | null;
  dropTargets: Map<string, DropTargetWithState>;
  activeDropTargetId: string | null;
  isDragging: boolean;
};

// Action types
type DndActions = {
  startDrag: (
    item: DragItem,
    position: { x: number; y: number; width: number; height: number },
    preview?: React.ReactNode,
  ) => void;
  updateDragPosition: (x: number, y: number) => void;
  endDrag: () => void;
  registerDropTarget: (target: DropTarget) => void;
  unregisterDropTarget: (id: string) => void;
  updateDropTarget: (
    id: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => void;
  setActiveDropTarget: (id: string | null) => void;
  getCompatibleTargets: () => DropTargetWithState[];
  getDropTargetState: (
    id: string,
  ) => { canDrop: boolean; isOver: boolean } | null;
};

// Combined store type
export type DndStore = DndState & DndActions;

// Default initial state
export const defaultInitState: DndState = {
  dragItem: null,
  dragPosition: null,
  dragPreview: null,
  dropTargets: new Map(),
  activeDropTargetId: null,
  isDragging: false,
};

// Helper function to check if target accepts drag item
function doesTargetAccept(target: DropTarget, dragItem: DragItem): boolean {
  const dragType = dragItem.type;
  const sourceZone = dragItem._sourceZone;

  // Prevent dropping back into the same zone
  if (sourceZone && target.id === sourceZone) {
    return false;
  }

  return target.accepts.includes(dragType);
}

// Helper to update canDrop for all targets
function updateCanDropStates(
  targets: Map<string, DropTargetWithState>,
  dragItem: DragItem | null,
): Map<string, DropTargetWithState> {
  const newTargets = new Map(targets);

  for (const [id, target] of newTargets) {
    const canDrop = dragItem ? doesTargetAccept(target, dragItem) : false;
    newTargets.set(id, { ...target, canDrop });
  }

  return newTargets;
}

// Factory function to create DnD store
export const createDndStore = (initState: DndState = defaultInitState) => {
  return createStore<DndStore>()(
    subscribeWithSelector((set, get) => ({
      ...initState,

      startDrag: (item, position, preview) => {
        const currentTargets = get().dropTargets;
        const updatedTargets = updateCanDropStates(currentTargets, item);

        set({
          dragItem: item,
          dragPosition: position,
          dragPreview: preview ?? null,
          isDragging: true,
          activeDropTargetId: null,
          dropTargets: updatedTargets,
        });
      },

      updateDragPosition: (x, y) => {
        const state = get();
        if (!state.dragItem || !state.dragPosition) return;

        // Find the best drop target at current position using visual stacking order.
        // elementsFromPoint returns elements in visual order (topmost first),
        let newActiveDropTargetId: string | null = null;

        const elementsAtPoint = document.elementsFromPoint(x, y);

        for (const element of elementsAtPoint) {
          const zoneId = (element as HTMLElement).dataset?.zoneId;
          if (zoneId) {
            const target = state.dropTargets.get(zoneId);
            if (target?.canDrop) {
              newActiveDropTargetId = zoneId;
              break; // Stop at first valid target in stacking order
            }
          }
        }

        // Only update if position or active drop target changed
        const positionChanged =
          state.dragPosition &&
          (state.dragPosition.x !== x || state.dragPosition.y !== y);
        const activeDropTargetChanged =
          state.activeDropTargetId !== newActiveDropTargetId;

        if (positionChanged || activeDropTargetChanged) {
          // Update isOver state for drop targets
          const newTargets = new Map(state.dropTargets);

          // Clear previous isOver
          if (
            state.activeDropTargetId &&
            state.activeDropTargetId !== newActiveDropTargetId
          ) {
            const prevTarget = newTargets.get(state.activeDropTargetId);
            if (prevTarget) {
              newTargets.set(state.activeDropTargetId, {
                ...prevTarget,
                isOver: false,
              });
            }
          }

          // Set new isOver
          if (newActiveDropTargetId) {
            const newTarget = newTargets.get(newActiveDropTargetId);
            if (newTarget) {
              newTargets.set(newActiveDropTargetId, {
                ...newTarget,
                isOver: true,
              });
            }
          }

          set({
            dragPosition: state.dragPosition
              ? { ...state.dragPosition, x, y }
              : null,
            activeDropTargetId: newActiveDropTargetId,
            dropTargets: newTargets,
          });
        }
      },

      endDrag: () => {
        const currentTargets = get().dropTargets;

        // Clear all canDrop and isOver states
        const clearedTargets = new Map<string, DropTargetWithState>();
        for (const [id, target] of currentTargets) {
          clearedTargets.set(id, { ...target, canDrop: false, isOver: false });
        }

        // First, set isDragging to false to trigger drop target callbacks
        set({
          dragItem: null,
          dragPosition: null,
          dragPreview: null,
          isDragging: false,
          dropTargets: clearedTargets,
          // Keep activeDropTargetId for a moment so drop targets can read it
        });

        // Reset activeDropTargetId after a short delay to allow drop targets to process
        setTimeout(() => {
          set({ activeDropTargetId: null });
        }, 0);
      },

      registerDropTarget: (target) => {
        set((state) => {
          const newTargets = new Map(state.dropTargets);

          // Initialize with current drag state
          const canDrop = state.dragItem
            ? doesTargetAccept(target, state.dragItem)
            : false;
          const isOver = state.activeDropTargetId === target.id;

          const targetWithState: DropTargetWithState = {
            ...target,
            canDrop,
            isOver,
          };

          newTargets.set(target.id, targetWithState);

          return { dropTargets: newTargets };
        });
      },

      unregisterDropTarget: (id) => {
        set((state) => {
          const newTargets = new Map(state.dropTargets);
          newTargets.delete(id);

          return {
            dropTargets: newTargets,
            activeDropTargetId:
              state.activeDropTargetId === id ? null : state.activeDropTargetId,
          };
        });
      },

      updateDropTarget: (id, bounds) => {
        set((state) => {
          const target = state.dropTargets.get(id);
          if (!target) return state;

          const updatedTarget: DropTargetWithState = { ...target, ...bounds };
          const newTargets = new Map(state.dropTargets);
          newTargets.set(id, updatedTarget);

          return { dropTargets: newTargets };
        });
      },

      setActiveDropTarget: (id) => {
        set({ activeDropTargetId: id });
      },

      // Selectors
      getCompatibleTargets: () => {
        const state = get();
        return Array.from(state.dropTargets.values()).filter(
          (target) => target.canDrop,
        );
      },

      getDropTargetState: (id) => {
        const target = get().dropTargets.get(id);
        if (!target) return null;
        return { canDrop: target.canDrop, isOver: target.isOver };
      },
    })),
  );
};
