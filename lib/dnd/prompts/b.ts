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
  updateDropTargetPosition: (
    id: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => void;
  setActiveDropTarget: (id: string | null) => void;
  validDropTargets: DropTarget[];
};

// Helper function to check if target accepts drag item
function doesTargetAccept(target: DropTarget, dragItem: DragItem): boolean {
  const itemType = dragItem.type;

  // Check if the target accepts the item type
  const acceptsType = target.accepts.includes(itemType);

  return acceptsType;
}

export const useDndStore = create<DndStore>()(
  subscribeWithSelector((set, get) => ({
    dragItem: null,
    dragPosition: null,
    dragPreview: null,
    dropTargets: new Map(),
    isDragging: false,
    activeDropTargetId: null,

    setActiveDropTarget: (id) => {
      set({ activeDropTargetId: id });
    },

    get validDropTargets() {
      return Array.from(get().dropTargets.values()).filter(
        (target) => target.willAccept === true,
      );
    },

    startDrag: (item, position, preview) => {
      // Update the dropTargets map to set willAccept for all targets.
      const allTargets = get().dropTargets;
      const newTargets = new Map(allTargets);
      for (const target of newTargets.values()) {
        target.willAccept = doesTargetAccept(target, item);
      }

      set({
        dragItem: item,
        dragPosition: position,
        dragPreview: preview ?? null,
        dropTargets: newTargets,
      });
    },

    updateDragPosition: (x, y) => {
      const state = get();
      if (!state.dragItem || !state.dragPosition) return;

      const positionChanged =
        state.dragPosition.x !== x || state.dragPosition.y !== y;

      if (!positionChanged) return;

      // Find drop target at current position using simple iteration
      // Using simple iteration for hit detection - BSP tree removed for simplicity
      let foundTarget: DropTarget | null = null;

      // Possible targets are only those that have willAccept = true;
      const possibleTargets = Array.from(state.dropTargets.values()).filter(
        (target) => target.willAccept,
      );

      for (const target of possibleTargets) {
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
        // Update the isOver state for the found target
        foundTarget.isOver = true;
        set({
          dropTargets: new Map(state.dropTargets).set(
            foundTarget.id,
            foundTarget,
          ),
        });
      }

      set({
        dragPosition: { ...state.dragPosition, x, y },
      });
    },

    endDrag: () => {
      // First, set isDragging to false to trigger drop target callbacks
      set({
        dragItem: null,
        dragPosition: null,
        dragPreview: null,
        dropTargets: new Map(get().dropTargets).forEach((target) => {
          target.isOver = false; // Reset isOver state
          target.willAccept = false; // Reset willAccept state
        }),
      });
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
        };
      });
    },

    updateDropTargetPosition: (id, bounds) => {
      set((state) => {
        const target = state.dropTargets.get(id);
        if (!target) return state;

        const updatedTarget = { ...target, ...bounds };
        const newTargets = new Map(state.dropTargets);
        newTargets.set(id, updatedTarget);

        return { dropTargets: newTargets };
      });
    },
  })),
);
