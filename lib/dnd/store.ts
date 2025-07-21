import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type DragItem, type DropTarget } from './types';

type DndStore = {
  // State
  dragItem: DragItem | null;
  dragPosition: { x: number; y: number; width: number; height: number } | null;
  dragPreview: React.ReactNode | null;
  dropTargets: Map<string, DropTarget>;
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
};

// Helper function to check if target accepts drag item
function doesTargetAccept(target: DropTarget, dragItem: DragItem): boolean {
  const itemType = dragItem.metadata.type as string;
  const sourceZone = dragItem.metadata.sourceZone as string;

  // Check if the target accepts the item type
  const acceptsType = target.accepts.includes(itemType);

  // Prevent dropping back into the same zone
  const notSameZone = !target.zoneId || sourceZone !== target.zoneId;

  return acceptsType && notSameZone;
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
      set({
        dragItem: item,
        dragPosition: position,
        dragPreview: preview ?? null,
        isDragging: true,
        activeDropTargetId: null,
      });
    },

    updateDragPosition: (x, y) => {
      const state = get();
      if (!state.dragItem || !state.dragPosition) return;

      // Find drop target at current position using simple iteration
      // TODO: Restore BSP tree optimization after fixing isolation issues
      let foundTarget: DropTarget | null = null;
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

      if (foundTarget) {
        // Check if this target accepts the drag item
        const accepts = doesTargetAccept(foundTarget, state.dragItem);
        if (accepts) {
          newActiveDropTargetId = foundTarget.id;
        }
      }

      // Only update if position or active drop target changed
      const positionChanged =
        state.dragPosition.x !== x || state.dragPosition.y !== y;
      const activeDropTargetChanged =
        state.activeDropTargetId !== newActiveDropTargetId;

      if (positionChanged || activeDropTargetChanged) {
        set({
          dragPosition: { ...state.dragPosition, x, y },
          activeDropTargetId: newActiveDropTargetId,
        });
      }
    },

    endDrag: () => {
      // First, set isDragging to false to trigger drop target callbacks
      set({
        dragItem: null,
        dragPosition: null,
        dragPreview: null,
        isDragging: false,
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
        newTargets.set(target.id, target);

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

        const updatedTarget = { ...target, ...bounds };
        const newTargets = new Map(state.dropTargets);
        newTargets.set(id, updatedTarget);

        return { dropTargets: newTargets };
      });
    },

    setActiveDropTarget: (id) => {
      set({ activeDropTargetId: id });
    },
  })),
);
