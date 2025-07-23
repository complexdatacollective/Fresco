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
  boundsRefreshFunctions: Map<string, () => void>;
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
  registerBoundsRefresh: (id: string, refreshFn: () => void) => void;
  unregisterBoundsRefresh: (id: string) => void;
  refreshAllBounds: () => void;
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
  boundsRefreshFunctions: new Map(),
};

// Helper function to check if target accepts drag item
function doesTargetAccept(target: DropTarget, dragItem: DragItem): boolean {
  const itemType = dragItem.type;
  const sourceZone = dragItem._sourceZone;

  // Check if the target accepts the item type
  const acceptsType = target.accepts.includes(itemType);

  // Prevent dropping back into the same zone
  if (sourceZone && target.id === sourceZone) {
    return false;
  }

  return acceptsType;
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

        // Trigger bounds refresh for all drop targets to catch dynamic changes
        get().refreshAllBounds();

        // Get fresh state after bounds refresh
        const updatedState = get();

        // Find drop target at current position
        let foundTarget: DropTargetWithState | null = null;
        let newActiveDropTargetId: string | null = null;

        for (const target of updatedState.dropTargets.values()) {
          if (
            x >= target.x &&
            x <= target.x + target.width &&
            y >= target.y &&
            y <= target.y + target.height
          ) {
            foundTarget = target;
            break;
          }
        }

        if (foundTarget && foundTarget.canDrop) {
          newActiveDropTargetId = foundTarget.id;
        }

        // Only update if position or active drop target changed
        const positionChanged =
          updatedState.dragPosition &&
          (updatedState.dragPosition.x !== x ||
            updatedState.dragPosition.y !== y);
        const activeDropTargetChanged =
          updatedState.activeDropTargetId !== newActiveDropTargetId;

        if (positionChanged || activeDropTargetChanged) {
          // Update isOver state for drop targets
          const newTargets = new Map(updatedState.dropTargets);

          // Clear previous isOver
          if (
            updatedState.activeDropTargetId &&
            updatedState.activeDropTargetId !== newActiveDropTargetId
          ) {
            const prevTarget = newTargets.get(updatedState.activeDropTargetId);
            if (prevTarget) {
              newTargets.set(updatedState.activeDropTargetId, {
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
            dragPosition: updatedState.dragPosition
              ? { ...updatedState.dragPosition, x, y }
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

          // If dragging, recalculate isOver for all targets based on current position
          let newActiveDropTargetId = state.activeDropTargetId;

          if (state.isDragging && state.dragPosition) {
            const { x, y } = state.dragPosition;

            // Clear all isOver states first
            for (const [targetId, targetState] of newTargets) {
              newTargets.set(targetId, { ...targetState, isOver: false });
            }

            // Find which target the mouse is currently over
            let foundTarget: DropTargetWithState | null = null;
            for (const targetState of newTargets.values()) {
              if (
                x >= targetState.x &&
                x <= targetState.x + targetState.width &&
                y >= targetState.y &&
                y <= targetState.y + targetState.height
              ) {
                foundTarget = targetState;
                break;
              }
            }

            // Update active target and isOver state
            if (foundTarget && foundTarget.canDrop) {
              newActiveDropTargetId = foundTarget.id;
              newTargets.set(foundTarget.id, { ...foundTarget, isOver: true });
            } else {
              newActiveDropTargetId = null;
            }
          }

          return {
            dropTargets: newTargets,
            activeDropTargetId: newActiveDropTargetId,
          };
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

      registerBoundsRefresh: (id, refreshFn) => {
        set((state) => {
          const newRefreshFunctions = new Map(state.boundsRefreshFunctions);
          newRefreshFunctions.set(id, refreshFn);
          return { boundsRefreshFunctions: newRefreshFunctions };
        });
      },

      unregisterBoundsRefresh: (id) => {
        set((state) => {
          const newRefreshFunctions = new Map(state.boundsRefreshFunctions);
          newRefreshFunctions.delete(id);
          return { boundsRefreshFunctions: newRefreshFunctions };
        });
      },

      refreshAllBounds: () => {
        const state = get();
        for (const refreshFn of state.boundsRefreshFunctions.values()) {
          refreshFn();
        }
      },
    })),
  );
};
