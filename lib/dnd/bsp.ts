import { type DropTarget } from './types';

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
export function createBSPTree() {
  return new BSPTree();
}
