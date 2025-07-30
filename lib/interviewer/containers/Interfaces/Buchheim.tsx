// // import TreeNode from './TreeNode';

// // TODO: things missing
// // Need to account for invisible parent's parents, e.g. the subjects grandparents
// // Need to account for marriage/partner linkages
// // Need to account for originator being one step down from root

// class TreeNode {
//   label: string;
//   children: TreeNode[];

//   constructor(label: string, children: TreeNode[] = []) {
//     this.label = label;
//     this.children = children;
//   }
// }

// class DrawTree {
//   x: number = -1;
//   y: number;
//   tree: TreeNode;
//   label: string;
//   children: DrawTree[];
//   parent: DrawTree | null;
//   thread: DrawTree | null = null;
//   offset: number = 0;
//   ancestor: DrawTree;
//   change: number = 0;
//   shift: number = 0;
//   number: number;
//   mod: number = 0;
//   private _lmost_sibling: DrawTree | null = null;

//   constructor(
//     tree: TreeNode,
//     parent: DrawTree | null = null,
//     depth = 0,
//     number = 1,
//   ) {
//     this.tree = tree;
//     this.label = tree.label;
//     this.parent = parent;
//     this.y = depth;
//     this.number = number;
//     this.ancestor = this;

//     this.children = tree.children.map(
//       (child, i) => new DrawTree(child, this, depth + 1, i + 1),
//     );
//   }

//   leftBrother(): DrawTree | null {
//     if (this.parent) {
//       let n: DrawTree | null = null;

//       for (const node of this.parent.children) {
//         if (node === this) return n;
//         n = node;
//       }
//     }
//     return null;
//   }

//   get leftmostSibling(): DrawTree | null {
//     if (
//       !this._lmost_sibling &&
//       this.parent &&
//       this !== this.parent.children[0]
//     ) {
//       this._lmost_sibling = this.parent.children[0];
//     }
//     return this._lmost_sibling;
//   }

//   left(): DrawTree | null {
//     return this.children.length > 0 ? this.children[0] : this.thread;
//   }

//   right(): DrawTree | null {
//     return this.children.length > 0
//       ? this.children[this.children.length - 1]
//       : this.thread;
//   }
// }

// function buchheim(tree: TreeNode): DrawTree {
//   const dt = firstWalk(new DrawTree(tree));
//   const min = secondWalk(dt);
//   if (min < 0) thirdWalk(dt, -min);
//   return dt;
// }

// function firstWalk(v: DrawTree, distance = 1): DrawTree {
//   if (v.children.length === 0) {
//     const leftSibling = v.leftmostSibling;
//     v.x = leftSibling ? v.leftBrother()!.x + distance : 0;
//   } else {
//     let defaultAncestor = v.children[0];
//     for (const w of v.children) {
//       firstWalk(w);
//       defaultAncestor = apportion(w, defaultAncestor, distance);
//     }
//     executeShifts(v);

//     const midpoint =
//       (v.children[0].x + v.children[v.children.length - 1].x) / 2;
//     const w = v.leftBrother();
//     if (w) {
//       v.x = w.x + distance;
//       v.mod = v.x - midpoint;
//     } else {
//       v.x = midpoint;
//     }
//   }
//   return v;
// }

// function apportion(
//   v: DrawTree,
//   defaultAncestor: DrawTree,
//   distance: number,
// ): DrawTree {
//   // i === inner; o === outer; r === right; l === left;
//   // walker: vir, starts_at: v, purpose: Inner right side of current subtree
//   // walker: vil, starts_at: w, purpose: Inner left side of left sibling subtree
//   // walker: vor, starts_at: v, purpose: Outer right side of current subtree
//   // walker vol, starts_at: leftmost sibling of v, purpose: Outer left side of left sibling subtree
//   const w = v.leftBrother();
//   if (w) {
//     let vir = v,
//       vor = v;
//     let vil = w;
//     let vol = v.leftmostSibling!;
//     let sir = v.mod,
//       sor = v.mod;
//     let sil = vil.mod,
//       sol = vol.mod;

//     while (vil.right() && vir.left()) {
//       vil = vil.right()!;
//       vir = vir.left()!;
//       vol = vol.left()!;
//       vor = vor.right()!;
//       vor.ancestor = v;

//       const shift = vil.x + sil - (vir.x + sir) + distance;
//       if (shift > 0) {
//         const a = ancestor(vil, v, defaultAncestor);
//         moveSubtree(a, v, shift);
//         sir += shift;
//         sor += shift;
//       }

//       sil += vil.mod;
//       sir += vir.mod;
//       sol += vol.mod;
//       sor += vor.mod;
//     }

//     if (vil.right() && !vor.right()) {
//       vor.thread = vil.right();
//       vor.mod += sil - sor;
//     } else if (vir.left() && !vol.left()) {
//       vol.thread = vir.left();
//       vol.mod += sir - sol;
//     }

//     defaultAncestor = v;
//   }
//   return defaultAncestor;
// }

// function moveSubtree(wl: DrawTree, wr: DrawTree, shift: number): void {
//   const subtrees = wr.number - wl.number;
//   wr.change -= shift / subtrees;
//   wr.shift += shift;
//   wl.change += shift / subtrees;
//   wr.x += shift;
//   wr.mod += shift;
// }

// function executeShifts(v: DrawTree): void {
//   let shift = 0,
//     change = 0;
//   for (let i = v.children.length - 1; i >= 0; i--) {
//     const w = v.children[i];
//     w.x += shift;
//     w.mod += shift;
//     change += w.change;
//     shift += w.shift + change;
//   }
// }

// function ancestor(
//   vil: DrawTree,
//   v: DrawTree,
//   defaultAncestor: DrawTree,
// ): DrawTree {
//   return vil.ancestor && v.parent?.children.includes(vil.ancestor)
//     ? vil.ancestor
//     : defaultAncestor;
// }

// function secondWalk(
//   v: DrawTree,
//   m = 0,
//   depth = 0,
//   min: number | null = null,
// ): number {
//   v.x += m;
//   v.y = depth;

//   if (min === null || v.x < min) {
//     min = v.x;
//   }

//   for (const w of v.children) {
//     min = secondWalk(w, m + v.mod, depth + 1, min);
//   }

//   return min;
// }

// function thirdWalk(tree: DrawTree, n: number): void {
//   tree.x += n;
//   for (const child of tree.children) {
//     thirdWalk(child, n);
//   }
// }

// const nodeF = new TreeNode('F');
// const nodeE = new TreeNode('E');
// const nodeD = new TreeNode('D', [nodeF]);
// const nodeC = new TreeNode('C', [nodeE]);
// const nodeB = new TreeNode('B');
// const nodeA = new TreeNode('A', [nodeB, nodeC, nodeD]);
// const nodeO = new TreeNode('O', [nodeB, nodeC, nodeD]);
// const nodel = new TreeNode('invisible', [nodeO, nodeA]);

// const laidOutTree = buchheim(nodel);

// function printTreeLayout(drawTree: DrawTree, label = 'invisible', indent = '') {
//   console.log(
//     `${indent}${label}: (x=${drawTree.x.toFixed(2)}, y=${drawTree.y})`,
//   );
//   for (let i = 0; i < drawTree.children.length; i++) {
//     const childLabel = drawTree.children[i].label;
//     printTreeLayout(drawTree.children[i], childLabel, indent + '  ');
//   }
// }

// let womp = printTreeLayout(laidOutTree);
