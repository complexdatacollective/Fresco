import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type DragItem, type DropTarget } from './types';

// Extended drop target with state
type DropTargetWithState = DropTarget & {
  canDrop: boolean;
  isOver: boolean;
};

type DndStore = {
  // State
  dragItem: DragItem | null;
  dragPosition: { x: number; y: number; width: number; height: number } | null;
  dragPreview: React.ReactNode | null;
  dropTargets: Map<string, DropTargetWithState>;
  activeDropTargetId: string | null;
  isDragging: boolean;

  // Actions
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

  // Selectors
  getCompatibleTargets: () => DropTargetWithState[];
  getDropTargetState: (
    id: string,
  ) => { canDrop: boolean; isOver: boolean } | null;
};

// Helper function to check if target accepts drag item
function doesTargetAccept(target: DropTarget, dragItem: DragItem): boolean {
  const itemType = dragItem.type;
  const sourceZone = dragItem._sourceZone;
  const sourceZoneTitle = dragItem._sourceZoneTitle;

  // Check if the target accepts the item type
  const acceptsType = target.accepts.includes(itemType);

  // Prevent dropping back into the same zone - handle hydration mismatch
  if (sourceZone && target.id === sourceZone) {
    return false;
  }

  // Additional check for hydration mismatch: compare by title if available
  if (sourceZoneTitle && target.announcedName === sourceZoneTitle) {
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

export const useDndStore = create<DndStore>()(
  subscribeWithSelector((set, get) => ({
    dragItem: null,
    dragPosition: null,
    dragPreview: null,
    dropTargets: new Map(),
    activeDropTargetId: null,
    isDragging: false,

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

      // Find drop target at current position
      let foundTarget: DropTargetWithState | null = null;
      let newActiveDropTargetId: string | null = null;

      for (const target of state.dropTargets.values()) {
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
        state.dragPosition.x !== x || state.dragPosition.y !== y;
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
          dragPosition: { ...state.dragPosition, x, y },
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

// Selectors for drop targets to avoid unnecessary re-renders
export const useDropTargetState = (id: string) =>
  useDndStore((state) => {
    const target = state.dropTargets.get(id);
    return target ? { canDrop: target.canDrop, isOver: target.isOver } : null;
  });

// Memoized selector with proper equality checking
export const useCompatibleTargets = () =>
  useDndStore(
    (state) => {
      const compatibleTargets = Array.from(state.dropTargets.values()).filter(
        (target) => target.canDrop,
      );
      return compatibleTargets;
    },
    (a: DropTargetWithState[], b: DropTargetWithState[]) => {
      // Custom equality function to prevent unnecessary re-renders
      if (a.length !== b.length) return false;
      return a.every((target, index) => {
        const bTarget = b[index];
        return (
          bTarget &&
          target.id === bTarget.id &&
          target.canDrop === bTarget.canDrop
        );
      });
    },
  );
