import { RefObject } from 'react';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import FamilyTreeNodeList from './FamilyTreeNodeList';

// designate a layer number for each node
// layer 0 is the layer with no parents
export const assignLayers = (
  nodes: FamilyTreeNodeList,
  couples: [PlaceholderNodeProps, PlaceholderNodeProps][] = [],
): Map<PlaceholderNodeProps, number> => {
  const layers = new Map<PlaceholderNodeProps, number>();
  const queue: { node: PlaceholderNodeProps; layer: number }[] = [];

  nodes.allNodes().forEach((node) => {
    if (nodes.parentsOf(node).length === 0) {
      layers.set(node, 0);
      queue.push({ node, layer: 0 });
    }
  });

  while (queue.length > 0) {
    const { node, layer } = queue.shift()!;
    nodes.childrenOf(node).forEach((child) => {
      const prev = layers.get(child);
      const nextLayer = layer + 1;
      if (prev === undefined || nextLayer > prev) {
        layers.set(child, nextLayer);
        queue.push({ node: child, layer: nextLayer });
      }
    });
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes.allNodes()) {
      nodes.childrenOf(node).forEach((child) => {
        const childLayer = layers.get(child);
        if (childLayer !== undefined) {
          const desiredLayer = childLayer - 1;
          const prevLayer = layers.get(node);
          if (prevLayer === undefined || prevLayer < desiredLayer) {
            layers.set(node, desiredLayer);
            changed = true;
          }
        }
      });
    }
  }

  couples.forEach(([a, b]) => {
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
  });

  return layers;
};

// assign a coordinate pair to each node
export const assignCoordinates = (
  nodes: FamilyTreeNodeList,
  layers: Map<PlaceholderNodeProps, number>,
  couples: [PlaceholderNodeProps, PlaceholderNodeProps][],
  layerHeight = 120,
  nodeWidth = 220,
): [
  Map<PlaceholderNodeProps, { x: number; y: number }>,
  Map<number, PlaceholderNodeProps[]>,
] => {
  const coords = new Map<PlaceholderNodeProps, { x: number; y: number }>();

  // collect nodes by their assigned layer number
  const grouped = new Map<number, PlaceholderNodeProps[]>();
  layers.entries().forEach(([node, layer]) => {
    if (!grouped.has(layer)) grouped.set(layer, []);
    grouped.get(layer)!.push(node);
  });

  const maxLayer = Math.max(...grouped.keys());
  let nextX = 0;

  for (let layer = maxLayer; layer >= 0; layer--) {
    const nodesAtLayer = grouped.get(layer) ?? [];
    const placed = new Set<PlaceholderNodeProps>();

    nodesAtLayer.forEach((node) => {
      if (placed.has(node)) return;
      const y = layer * layerHeight;

      const couple = couples.find(
        ([a, b]) =>
          (a === node && nodesAtLayer.includes(b)) ||
          (b === node && nodesAtLayer.includes(a)),
      );

      if (couple) {
        // node is part of a couple
        // center couples over their children, space them 1/2 nodeWidth apart
        const [a, b] = couple;
        if (coords.has(a) && coords.has(b)) {
          placed.add(a);
          placed.add(b);
          return;
        }

        const sharedChildren =
          nodes
            .childrenOf(a)
            .filter((child) => nodes.childrenOf(b)?.includes(child)) ?? [];
        const childXs = sharedChildren
          .map((child) => coords.get(child)?.x)
          .filter((x): x is number => x !== undefined);

        let centerX = 0;
        if (childXs.length > 0) {
          centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
        } else {
          centerX = nextX * nodeWidth;
          nextX++;
        }

        coords.set(a, { x: centerX - nodeWidth / 4, y });
        coords.set(b, { x: centerX + nodeWidth / 4, y });
        placed.add(a);
        placed.add(b);
      } else {
        // node isn't part of a couple
        const childXs =
          nodes
            .childrenOf(node)
            ?.map((c) => coords.get(c)?.x)
            .filter((x): x is number => x !== undefined) ?? [];

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
    });
  }

  return [coords, grouped];
};

export const arrangeSiblings = (
  nodes: FamilyTreeNodeList,
  grouped: Map<number, PlaceholderNodeProps[]>,
  coords: Map<PlaceholderNodeProps, { x: number; y: number }>,
): void => {
  // find parents of first node (if exist)
  // check each node and if shared parents, slot it in to left
};

export const arrangeCouples = (
  nodes: FamilyTreeNodeList,
  coords: Map<PlaceholderNodeProps, { x: number; y: number }>,
  couples: [PlaceholderNodeProps, PlaceholderNodeProps][],
): void => {
  for (const [a, b] of couples) {
    const aCoords = coords.get(a);
    const bCoords = coords.get(b);
    if (!aCoords || !bCoords) continue;

    const aHasParents = (nodes.parentsOf(a)?.length ?? 0) > 0;
    const bHasParents = (nodes.parentsOf(b)?.length ?? 0) > 0;

    if (aHasParents === bHasParents) continue;

    const related = aHasParents ? a : b;
    const unrelated = aHasParents ? b : a;

    const parentXs =
      nodes
        .parentsOf(related)
        ?.map((p) => coords.get(p)?.x)
        .filter((x): x is number => x !== undefined) ?? [];

    const relatedCoords = coords.get(related)!;
    const unrelatedCoords = coords.get(unrelated)!;

    const parentAvgX =
      parentXs.reduce((sum, x) => sum + x, 0) / parentXs.length;

    const relatedDist = Math.abs(relatedCoords.x - parentAvgX);
    const unrelatedDist = Math.abs(unrelatedCoords.x - parentAvgX);

    if (unrelatedDist < relatedDist) {
      // swap the couple if the parents are closer to the partner than the child
      coords.set(related, unrelatedCoords);
      coords.set(unrelated, relatedCoords);
    }
  }
};

export function fixOverlaps(
  grouped: Map<number, PlaceholderNodeProps[]>,
  coords: Map<PlaceholderNodeProps, { x: number; y: number }>,
  couples: [PlaceholderNodeProps, PlaceholderNodeProps][],
): void {
  const nodeWidth = 220;
  grouped.forEach((layerNodes) => {
    const placed = new Set<PlaceholderNodeProps>();
    // order layer nodes by x's
    const inXOrder = [...layerNodes].sort(
      (a, b) => (coords.get(a)?.x ?? 0) - (coords.get(b)?.x ?? 0),
    );
    let lastNode: PlaceholderNodeProps;
    const INITIAL_X = -1000;
    let lastX = INITIAL_X;
    inXOrder.forEach((node) => {
      if (node === lastNode || placed.has(node)) console.log('skipping node');
      if (node === lastNode || placed.has(node)) return;

      const y = coords.get(node)?.y ?? 0;
      const couple = couples.find(
        ([a, b]) =>
          (a === node && layerNodes.includes(b)) ||
          (b === node && layerNodes.includes(a)),
      );
      if (lastX > INITIAL_X) {
        // space this node past the last one
        coords.set(node, { x: lastX + nodeWidth, y });
      }
      if (couple) {
        // jump to the next node after this couple
        const [a, b] = couple;
        if (a === node) {
          if (lastX > INITIAL_X) {
            coords.set(b, { x: lastX + 1.5 * nodeWidth, y });
          }
          lastX = coords.get(b)?.x ?? 0;
          lastNode = b;
          placed.add(b);
        } else {
          if (lastX > INITIAL_X) {
            coords.set(a, { x: lastX + 1.5 * nodeWidth, y });
          }
          lastX = coords.get(a)?.x ?? 0;
          lastNode = a;
          placed.add(a);
        }
        placed.add(node);
      } else {
        lastX = coords.get(node)?.x ?? 0;
      }
    });
  });
}

export const centerTree = (
  allNodes: PlaceholderNodeProps[],
  coords: Map<PlaceholderNodeProps, { x: number; y: number }>,
  elementRef: RefObject<HTMLDivElement>,
): void => {
  if (elementRef.current) {
    const boundingRectangle = elementRef.current.getBoundingClientRect();
    const boundingWidth = boundingRectangle?.width ?? 0;
    const boundingHeight = boundingRectangle?.height ?? 0;
    const inXOrder = [...allNodes].sort(
      (a, b) => (coords.get(a)?.x ?? 0) - (coords.get(b)?.x ?? 0),
    );
    const inYOrder = [...allNodes].sort(
      (a, b) => (coords.get(a)?.y ?? 0) - (coords.get(b)?.y ?? 0),
    );
    const lastXNode = inXOrder[inXOrder.length - 1];
    const firstXNode = inXOrder[0];
    const lastYNode = inYOrder[inYOrder.length - 1];
    const firstYNode = inYOrder[0];

    if (lastXNode && firstXNode && lastYNode && firstYNode) {
      const treeWidth =
        (coords.get(lastXNode)?.x ?? 0) - (coords.get(firstXNode)?.x ?? 0);
      const xShift = boundingWidth / 2 - treeWidth / 2;
      const treeHeight =
        (coords.get(lastYNode)?.y ?? 0) - (coords.get(firstYNode)?.y ?? 0);
      const yShift = boundingHeight / 2 - treeHeight / 2;
      allNodes.forEach((node) => {
        coords.set(node, {
          x: (coords.get(node)?.x ?? 0) + xShift,
          y: (coords.get(node)?.y ?? 0) + yShift,
        });
      });
    }
  }
};
