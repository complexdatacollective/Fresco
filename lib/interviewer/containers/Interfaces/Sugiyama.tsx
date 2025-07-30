class TreeNode {
  id: string;
  parents: TreeNode[] = [];
  children: TreeNode[] = [];
  constructor(id: string) {
    this.id = id;
  }
}

const A1 = new TreeNode('A1');
const A2 = new TreeNode('A2');
const A3 = new TreeNode('A3');
const O = new TreeNode('O');
const Q = new TreeNode('Q');
const B = new TreeNode('B');
const C = new TreeNode('C');
const D1 = new TreeNode('D1');
const D2 = new TreeNode('D2');
const E = new TreeNode('E');

A1.children.push(B, C, D1);
A2.children.push(B, C, D1, O, Q);
A3.children.push(O, Q);

Q.parents.push(A2, A3);
O.parents.push(A2, A3);
B.parents.push(A1, A2);
C.parents.push(A1, A2);
D1.parents.push(A1, A2);
D1.children.push(E);
D2.children.push(E);
E.parents.push(D1, D2);

const couples: [TreeNode, TreeNode][] = [
  [A1, A2],
  [A2, A3],
  [D1, D2],
];

function assignLayers(
  nodes: TreeNode[],
  couples: [TreeNode, TreeNode][] = [],
): Map<TreeNode, number> {
  const layers = new Map<TreeNode, number>();
  const queue: { node: TreeNode; layer: number }[] = [];

  for (const node of nodes) {
    if (node.parents.length === 0) {
      layers.set(node, 0);
      queue.push({ node, layer: 0 });
    }
  }

  while (queue.length > 0) {
    const { node, layer } = queue.shift()!;
    for (const child of node.children) {
      const prev = layers.get(child);
      const nextLayer = layer + 1;
      if (prev === undefined || nextLayer > prev) {
        layers.set(child, nextLayer);
        queue.push({ node: child, layer: nextLayer });
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      for (const child of node.children) {
        const childLayer = layers.get(child);
        if (childLayer !== undefined) {
          const desiredLayer = childLayer - 1;
          const prevLayer = layers.get(node);
          if (prevLayer === undefined || prevLayer < desiredLayer) {
            layers.set(node, desiredLayer);
            changed = true;
          }
        }
      }
    }
  }

  for (const [a, b] of couples) {
    const aLayer = layers.get(a);
    const bLayer = layers.get(b);

    if (aLayer !== undefined && bLayer === undefined) {
      layers.set(b, aLayer);
    } else if (bLayer !== undefined && aLayer === undefined) {
      layers.set(a, bLayer);
    } else if (
      aLayer !== undefined &&
      bLayer !== undefined &&
      aLayer !== bLayer
    ) {
      const target = Math.max(aLayer, bLayer);
      layers.set(a, target);
      layers.set(b, target);
    }
  }

  return layers;
}

function assignCoordinates(
  layers: Map<TreeNode, number>,
  couples: [TreeNode, TreeNode][],
  layerHeight = 100,
  nodeWidth = 150,
): Map<TreeNode, { x: number; y: number }> {
  const coords = new Map<TreeNode, { x: number; y: number }>();

  const grouped = new Map<number, TreeNode[]>();
  for (const [node, layer] of layers.entries()) {
    if (!grouped.has(layer)) grouped.set(layer, []);
    grouped.get(layer)!.push(node);
  }

  const maxLayer = Math.max(...grouped.keys());
  let nextX = 0;

  for (let layer = maxLayer; layer >= 0; layer--) {
    const nodesAtLayer = grouped.get(layer) || [];
    const placed = new Set<TreeNode>();

    for (const node of nodesAtLayer) {
      if (placed.has(node)) continue;
      const y = layer * layerHeight;

      const couple = couples.find(
        ([a, b]) =>
          (a === node && nodesAtLayer.includes(b)) ||
          (b === node && nodesAtLayer.includes(a)),
      );

      if (couple) {
        const [a, b] = couple;
        if (coords.has(a) && coords.has(b)) {
          placed.add(a);
          placed.add(b);
          continue;
        }

        const sharedChildren = a.children.filter((child) =>
          b.children.includes(child),
        );
        const childXs = sharedChildren
          .map((child) => coords.get(child)?.x)
          .filter((x): x is number => x !== undefined);

        let centerX = 0;
        if (childXs.length > 0) {
          centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
        } else {
          centerX = nextX * nodeWidth;
          nextX += 1.5;
        }

        coords.set(a, { x: centerX - nodeWidth / 4, y });
        coords.set(b, { x: centerX + nodeWidth / 4, y });
        placed.add(a);
        placed.add(b);
      } else {
        const childXs = node.children
          .map((c) => coords.get(c)?.x)
          .filter((x): x is number => x !== undefined);

        let x = 0;
        if (childXs.length > 0) {
          x = childXs.reduce((a, b) => a + b, 0) / childXs.length;
        } else {
          x = nextX * nodeWidth;
          nextX++;
        }

        coords.set(node, { x, y });
        placed.add(node);
      }
    }
  }

  return coords;
}

function arrangeCouples(
  coords: Map<TreeNode, { x: number; y: number }>,
  couples: [TreeNode, TreeNode][],
): void {
  for (const [a, b] of couples) {
    const aCoords = coords.get(a);
    const bCoords = coords.get(b);
    if (!aCoords || !bCoords) continue;

    const aHasParents = a.parents.length > 0;
    const bHasParents = B.parents.length > 0;

    if (aHasParents === bHasParents) continue;

    const related = aHasParents ? a : b;
    const unrelated = aHasParents ? b : a;

    const parentXs = related.parents
      .map((p) => coords.get(p)?.x)
      .filter((x): x is number => x !== undefined);

    const relatedCoords = coords.get(related)!;
    const unrelatedCoords = coords.get(unrelated)!;

    const parentAvgX =
      parentXs.reduce((sum, x) => sum + x, 0) / parentXs.length;

    const relatedDist = Math.abs(relatedCoords.x - parentAvgX);
    const unrelatedDist = Math.abs(unrelatedCoords.x - parentAvgX);

    if (unrelatedDist < relatedDist) {
      coords.set(related, unrelatedCoords);
      coords.set(unrelated, relatedCoords);
    }
  }
}

const allNodes = [A1, A2, A3, O, Q, B, C, D1, D2, E];

const layers = assignLayers(allNodes, couples);
const coords = assignCoordinates(layers, couples);
arrangeCouples(coords, couples);

const generateCoords = function () {
  for (const node of allNodes) {
    const pos = coords.get(node)!;
    console.log(`${node.id}: x=${pos.x}, y=${pos.y}`);
  }
};

export default generateCoords;
