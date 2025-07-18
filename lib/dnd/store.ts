import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type DragItem, type DropTarget } from './types';

type DndStore = {
  // State
  dragItem: DragItem | null;
  dragPosition: { x: number; y: number; width: number; height: number } | null;
  dropTargets: Map<string, DropTarget>;
  activeDropTargetId: string | null;
  isDragging: boolean;

  // Actions
  startDrag: (
    item: DragItem,
    position: { x: number; y: number; width: number; height: number },
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

// Binary Space Partitioning for efficient hit detection
class BSPTree {
  private root: BSPNode | null = null;

  insert(target: DropTarget) {
    if (!this.root) {
      this.root = new BSPNode(target);
    } else {
      this.root.insert(target);
    }
  }

  remove(id: string) {
    if (this.root) {
      this.root = this.root.remove(id);
    }
  }

  findTarget(x: number, y: number): DropTarget | null {
    if (!this.root) return null;
    return this.root.find(x, y);
  }

  rebuild(targets: DropTarget[]) {
    this.root = null;
    targets.forEach((target) => this.insert(target));
  }
}

class BSPNode {
  private target: DropTarget;
  private left: BSPNode | null = null;
  private right: BSPNode | null = null;
  private splitAxis: 'x' | 'y';
  private splitValue: number;

  constructor(target: DropTarget) {
    this.target = target;
    this.splitAxis = 'x';
    this.splitValue = target.x + target.width / 2;
  }

  insert(target: DropTarget) {
    const targetCenter =
      this.splitAxis === 'x'
        ? target.x + target.width / 2
        : target.y + target.height / 2;

    if (targetCenter < this.splitValue) {
      if (this.left) {
        this.left.insert(target);
      } else {
        this.left = new BSPNode(target);
        this.left.splitAxis = this.splitAxis === 'x' ? 'y' : 'x';
      }
    } else {
      if (this.right) {
        this.right.insert(target);
      } else {
        this.right = new BSPNode(target);
        this.right.splitAxis = this.splitAxis === 'x' ? 'y' : 'x';
      }
    }
  }

  find(x: number, y: number): DropTarget | null {
    // Check current node
    if (this.isPointInTarget(x, y, this.target)) {
      return this.target;
    }

    // Search children
    const searchValue = this.splitAxis === 'x' ? x : y;

    if (searchValue < this.splitValue) {
      const leftResult = this.left?.find(x, y);
      if (leftResult) return leftResult;
      // Also check right side if point is near the split
      return this.right?.find(x, y) ?? null;
    } else {
      const rightResult = this.right?.find(x, y);
      if (rightResult) return rightResult;
      // Also check left side if point is near the split
      return this.left?.find(x, y) ?? null;
    }
  }

  remove(id: string): BSPNode | null {
    if (this.target.id === id) {
      // If this node is being removed, we need to restructure
      if (!this.left && !this.right) return null;
      if (!this.left) return this.right;
      if (!this.right) return this.left;

      // Both children exist, need to restructure
      // For simplicity, we'll just return the left child and reinsert right subtree
      const newRoot = this.left;
      this.reinsertSubtree(newRoot, this.right);
      return newRoot;
    }

    if (this.left) {
      this.left = this.left.remove(id);
    }
    if (this.right) {
      this.right = this.right.remove(id);
    }

    return this;
  }

  private reinsertSubtree(root: BSPNode, subtree: BSPNode) {
    root.insert(subtree.target);
    if (subtree.left) this.reinsertSubtree(root, subtree.left);
    if (subtree.right) this.reinsertSubtree(root, subtree.right);
  }

  private isPointInTarget(x: number, y: number, target: DropTarget): boolean {
    return (
      x >= target.x &&
      x <= target.x + target.width &&
      y >= target.y &&
      y <= target.y + target.height
    );
  }
}

// Create BSP tree factory to avoid singleton issues
function createBSPTree() {
  return new BSPTree();
}

// Global BSP tree instance
let bspTree = createBSPTree();

// Helper function to check if target accepts drag item
function doesTargetAccept(target: DropTarget, dragItem: DragItem): boolean {
  const itemType = dragItem.metadata.type as string;
  return target.accepts.includes(itemType);
}

// Function to reset BSP tree (fixes isolation issues)
export function resetBSPTree() {
  bspTree = createBSPTree();
}

export const useDndStore = create<DndStore>()(
  subscribeWithSelector((set, get) => ({
    dragItem: null,
    dragPosition: null,
    dropTargets: new Map(),
    activeDropTargetId: null,
    isDragging: false,

    startDrag: (item, position) => {
      set({
        dragItem: item,
        dragPosition: position,
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

        // Update BSP tree
        bspTree.insert(target);

        return { dropTargets: newTargets };
      });
    },

    unregisterDropTarget: (id) => {
      set((state) => {
        const newTargets = new Map(state.dropTargets);
        newTargets.delete(id);

        // Update BSP tree
        bspTree.remove(id);

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

        // Rebuild BSP tree when targets change position
        // In production, we might want to throttle this
        bspTree.rebuild(Array.from(newTargets.values()));

        return { dropTargets: newTargets };
      });
    },

    setActiveDropTarget: (id) => {
      set({ activeDropTargetId: id });
    },
  })),
);
