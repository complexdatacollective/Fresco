type Nullable<T> = T | null;

class TreeNode {
  name: string;
  children: TreeNode[];
  parent: Nullable<TreeNode> = null;

  x = 0;
  y = 0;
  mod = 0;
  thread: Nullable<TreeNode> = null;
  ancestor: TreeNode = this;
  change = 0;
  shift = 0;

  constructor(name: string, children: TreeNode[] = []) {
    this.name = name;
    this.children = children;

    for (const child of children) {
      child.parent = this;
    }
  }

  leftSibling(): Nullable<TreeNode> {
    if (!this.parent) return null;
    const idx = this.parent.children.indexOf(this);
    return idx > 0 ? this.parent.children[idx - 1] : null;
  }

  toJSON() {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      children: this.children,
    };
  }
}

export default TreeNode;
