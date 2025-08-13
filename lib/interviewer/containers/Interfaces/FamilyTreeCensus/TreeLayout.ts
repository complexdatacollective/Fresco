import { PlaceholderNodeProps } from './FamilyTreeNode';

class TreeLayout {
  nodes: PlaceholderNodeProps[];
  couples: [PlaceholderNodeProps, PlaceholderNodeProps][];
  layers: Map<PlaceholderNodeProps, number>;
  coords: Map<PlaceholderNodeProps, { x: number; y: number }>;
  grouped: Map<number, PlaceholderNodeProps[]>;
  layerHeight: number;
  nodeWidth: number;
  byId: Map<string, PlaceholderNodeProps>;

  constructor(nodes: PlaceholderNodeProps[]) {
    // this.nodes = [...nodes];
    this.nodes = nodes.map((node) => ({ ...node }));
    this.couples = [];
    this.layers = new Map<PlaceholderNodeProps, number>();
    // this.coords = new Map();
    this.coords = new Map<PlaceholderNodeProps, { x: number; y: number }>();
    this.grouped = new Map<number, PlaceholderNodeProps[]>();
    this.layerHeight = 130;
    this.nodeWidth = 130;
    this.byId = new Map(nodes.map((n) => [n.id!, n]));
  }

  arrangeNodes(offsets: {
    xOffset: number;
    yOffset: number;
  }): PlaceholderNodeProps[] {
    this.collectCouples();
    this.assignLayers();
    this.groupByLayer();
    this.assignCoordinates();
    this.fixOverlaps();
    this.ensureAllNodesHaveCoords();
    this.offsetNodes(offsets);

    return this.nodes;
  }

  childrenOf(parentNode: PlaceholderNodeProps): PlaceholderNodeProps[] {
    return this.nodes.filter((node) =>
      (parentNode.childIds ?? []).includes(node.id ?? ''),
    );
  }

  parentsOf(childNode: PlaceholderNodeProps): PlaceholderNodeProps[] {
    return this.nodes.filter((node) =>
      (childNode.parentIds ?? []).includes(node.id ?? ''),
    );
  }

  hasParents(childNode: PlaceholderNodeProps): boolean {
    return (
      this.nodes.find((node) =>
        (childNode.parentIds ?? []).includes(node.id ?? ''),
      ) != null
    );
  }

  partnerOf(spouseNode: PlaceholderNodeProps): PlaceholderNodeProps | null {
    return this.nodes.find((node) => spouseNode.partnerId == node.id) ?? null;
  }

  coupleExists(
    partnerA: PlaceholderNodeProps,
    partnerB: PlaceholderNodeProps,
  ): boolean {
    const couplesJson = JSON.stringify(this.couples);
    const coupleA = JSON.stringify([partnerA, partnerB]);
    const coupleB = JSON.stringify([partnerB, partnerA]);
    return (
      couplesJson.indexOf(coupleA) != -1 || couplesJson.indexOf(coupleB) != -1
    );
  }

  collectCouples() {
    this.nodes.forEach((node) => {
      const partner = this.partnerOf(node);
      if (partner == null || this.coupleExists(node, partner)) return;
      this.couples.push([node, partner]);
    });
  }

  orderByX(nodes: PlaceholderNodeProps[]): PlaceholderNodeProps[] {
    return [...nodes].sort(
      (a, b) => (this.coords.get(a)?.x ?? 0) - (this.coords.get(b)?.x ?? 0),
    );
  }

  // designate a layer number for each node
  // layer 0 is the layer with no parents
  assignLayers(): void {
    const queue: { node: PlaceholderNodeProps; layer: number }[] = [];

    this.nodes.forEach((node) => {
      if (this.parentsOf(node).length === 0) {
        this.layers.set(node, 0);
        queue.push({ node, layer: 0 });
      }
    });

    while (queue.length > 0) {
      const { node, layer } = queue.shift()!;
      this.childrenOf(node).forEach((child) => {
        const prev = this.layers.get(child);
        const nextLayer = layer + 1;
        if (prev === undefined || nextLayer > prev) {
          this.layers.set(child, nextLayer);
          queue.push({ node: child, layer: nextLayer });
        }
      });
    }

    let changed = true;
    while (changed) {
      changed = false;
      this.nodes.forEach((node) => {
        this.childrenOf(node).forEach((child) => {
          const childLayer = this.layers.get(child);
          if (childLayer !== undefined) {
            const desiredLayer = childLayer - 1;
            const prevLayer = this.layers.get(node);
            if (prevLayer === undefined || prevLayer < desiredLayer) {
              this.layers.set(node, desiredLayer);
              changed = true;
            }
          }
        });
      });
    }

    this.couples.forEach(([a, b]) => {
      const aLayer = this.layers.get(a);
      const bLayer = this.layers.get(b);

      if (aLayer !== undefined && bLayer === undefined) {
        this.layers.set(b, aLayer);
      } else if (bLayer !== undefined && aLayer === undefined) {
        this.layers.set(a, bLayer);
      } else if (
        aLayer !== undefined &&
        bLayer !== undefined &&
        aLayer !== bLayer
      ) {
        const target = Math.max(aLayer, bLayer);
        this.layers.set(a, target);
        this.layers.set(b, target);
      }
    });
  }

  groupByLayer() {
    // this.layers.entries().forEach(([node, layer]) => {
    //   if (!this.grouped.has(layer)) this.grouped.set(layer, []);
    //   this.grouped.get(layer)!.push(node);
    // });
    this.grouped.clear();
    this.layers.forEach((layer, node) => {
      if (!this.grouped.has(layer)) this.grouped.set(layer, []);
      this.grouped.get(layer)!.push(node);
    });
  }

  // assign a coordinate pair to each node
  assignCoordinates() {
    const maxLayer = Math.max(...this.grouped.keys());

    for (let layer = maxLayer; layer >= 0; layer--) {
      let nextX = 0;
      let nodesAtLayer = this.grouped.get(layer) ?? [];
      const placed = new Set<PlaceholderNodeProps>();

      nodesAtLayer.forEach((node) => {
        if (placed.has(node)) return;
        const y = layer * this.layerHeight;

        const couple = this.couples.find(
          ([a, b]) =>
            (a === node && nodesAtLayer.includes(b)) ||
            (b === node && nodesAtLayer.includes(a)),
        );

        if (couple) {
          // node is part of a couple
          // center couples over their children, space them 1/2 nodeWidth apart
          const [a, b] = couple;
          if (this.coords.has(a) && this.coords.has(b)) {
            placed.add(a);
            placed.add(b);
            return;
          }

          const sharedChildren =
            this.childrenOf(a).filter((child) =>
              this.childrenOf(b)?.includes(child),
            ) ?? [];
          const childXs = sharedChildren
            .map((child) => this.coords.get(child)?.x)
            .filter((x): x is number => x !== undefined);

          let centerX = 0;
          if (childXs.length > 0) {
            centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
          } else {
            centerX = nextX * this.nodeWidth;
            nextX++;
          }

          this.coords.set(a, { x: centerX - this.nodeWidth * 0.4, y });
          this.coords.set(b, { x: centerX + this.nodeWidth * 0.4, y });
          placed.add(a);
          placed.add(b);
        } else {
          // node isn't part of a couple
          const childXs =
            this.childrenOf(node)
              ?.map((c) => this.coords.get(c)?.x)
              .filter((x): x is number => x !== undefined) ?? [];

          let x = 0;
          if (childXs.length > 0) {
            x = childXs.reduce((a, b) => a + b, 0) / childXs.length;
          } else {
            x = nextX * this.nodeWidth;
            nextX++;
          }

          this.coords.set(node, { x, y });
          placed.add(node);
        }
      });

      this.orderCouplesBySex(nodesAtLayer);
      this.groupSiblings(nodesAtLayer);
    }
  }

  // swap couples so females are on the left
  orderCouplesBySex(nodes: PlaceholderNodeProps[]) {
    const placed = new Set<PlaceholderNodeProps>();
    nodes.forEach((node) => {
      if (placed.has(node)) return;

      const couple = this.couples.find(
        ([a, b]) =>
          (a === node && nodes.includes(b)) ||
          (b === node && nodes.includes(a)),
      );

      if (couple) {
        const [a, b] = couple;
        if (a.gender == 'male') {
          const aCoords = this.coords.get(a)!;
          this.coords.set(a, this.coords.get(b)!);
          this.coords.set(b, aCoords);
        }
        placed.add(a);
        placed.add(b);
      }
    });
  }

  // reorder siblings/couples by shared parents
  groupSiblings(nodes: PlaceholderNodeProps[]) {
    let foundAnchorNode = false;
    let lastUnmovedNode: PlaceholderNodeProps;
    // order layer nodes by x's
    const inXOrder = this.orderByX(nodes);
    inXOrder.forEach((node: PlaceholderNodeProps, i: number) => {
      // pick the first node with parents, and order the remaining nodes to its left
      if (foundAnchorNode || !this.hasParents(node)) return;
      foundAnchorNode = true;
      const parents = this.parentsOf(node);
      const { x, y } = this.coords.get(node)!;
      let numberMoved = 1;
      inXOrder
        .slice(i + 1)
        .forEach((otherNode: PlaceholderNodeProps, j: number) => {
          // move nodes with shared parents
          if (!this.hasParents(otherNode)) {
            lastUnmovedNode = otherNode;
            return;
          }

          const otherParent = this.parentsOf(otherNode)[0];

          if (otherParent != null && parents.includes(otherParent)) {
            const otherNodeCoords = this.coords.get(otherNode)!;
            this.coords.set(otherNode, {
              x: x - numberMoved++ * this.nodeWidth,
              y,
            });
            inXOrder
              .slice(i + j + 2)
              .forEach((neighborNode: PlaceholderNodeProps, k: number) => {
                const couple = this.couples.find(
                  ([a, b]) =>
                    (a === node && b === neighborNode) ||
                    (b === node && a === neighborNode),
                );
                if (couple) {
                  lastUnmovedNode = neighborNode;
                  return;
                }
                if (lastUnmovedNode) {
                  // adjust following nodes to the left
                  const unmovedNodeX = this.coords.get(lastUnmovedNode)!.x;
                  this.coords.set(neighborNode, {
                    x: unmovedNodeX + this.nodeWidth * (k + 1),
                    y,
                  });
                }
              });
          } else {
            lastUnmovedNode = otherNode;
          }
        });
    });
  }

  fixOverlaps() {
    this.grouped.forEach((layerNodes) => {
      const placed = new Set<PlaceholderNodeProps>();
      // order layer nodes by x's
      const inXOrder = this.orderByX(layerNodes);
      let lastNode: PlaceholderNodeProps;
      const INITIAL_X = -1000;
      let lastX = INITIAL_X;
      inXOrder.forEach((node) => {
        if (node === lastNode || placed.has(node)) return;

        const y = this.coords.get(node)!.y;
        const couple = this.couples.find(
          ([a, b]) =>
            (a === node && layerNodes.includes(b)) ||
            (b === node && layerNodes.includes(a)),
        );
        const nodeToBeMoved =
          lastX > INITIAL_X &&
          this.coords.get(node)!.x < lastX + this.nodeWidth;
        if (nodeToBeMoved) {
          // space this node past the last one
          this.coords.set(node, { x: lastX + this.nodeWidth, y });
        }
        if (couple) {
          // jump to the next node after this couple
          const [a, b] = couple;
          if (a === node) {
            if (nodeToBeMoved) {
              this.coords.set(b, { x: lastX + 1.8 * this.nodeWidth, y });
            }
            lastX = this.coords.get(b)?.x ?? 0;
            lastNode = b;
          } else {
            if (nodeToBeMoved) {
              this.coords.set(a, { x: lastX + 1.8 * this.nodeWidth, y });
            }
            lastX = this.coords.get(a)?.x ?? 0;
            lastNode = a;
          }
          placed.add(a);
          placed.add(b);
        } else {
          lastX = this.coords.get(node)?.x ?? 0;
        }
      });
    });
  }

  offsetNodes(offset: { xOffset: number; yOffset: number }) {
    console.log('THIS.NODES', this.nodes);
    console.log('THIS.COORDS', this.coords);
    // const leftmostNode = this.nodes.reduce((previous, current) =>
    //   this.coords.get(previous)!.x < this.coords.get(current)!.x
    //     ? previous
    //     : current,
    // );
    // const netXOffset = offset.xOffset - this.coords.get(leftmostNode)!.x;
    // this.nodes.forEach((node) => {
    //   const pos = this.coords.get(node);
    //   node.xPos = (pos?.x ?? 0) + netXOffset;
    //   node.yPos = (pos?.y ?? 0) + offset.yOffset;
    // });

    const values = Array.from(this.coords.values());
    if (!values.length) return;

    const minX = Math.min(...values.map((c) => c.x));
    const netXOffset = offset.xOffset - minX;

    this.nodes.forEach((node) => {
      const pos = this.coords.get(node) ?? {
        x: minX,
        y: (this.layers.get(node) ?? 0) * this.layerHeight,
      };
      node.xPos = pos.x + netXOffset;
      node.yPos = pos.y + offset.yOffset;
    });
  }

  private ensureAllNodesHaveCoords() {
    this.nodes.forEach((node) => {
      if (this.coords.has(node)) return;

      // layer = max(parent layer) + 1 (or 0 if none)
      const parentLayers = (node.parentIds ?? [])
        .map((pid) => this.byId.get(pid))
        .filter(Boolean)
        .map((p) => this.layers.get(p!) ?? 0);

      const layer = parentLayers.length
        ? Math.max(...parentLayers) + 1
        : (this.layers.get(node) ?? 0);
      const y = layer * this.layerHeight;

      // place next to siblings (same parent set)
      const key = JSON.stringify([...(node.parentIds ?? [])].sort());
      const siblings = this.nodes.filter(
        (n) =>
          JSON.stringify([...(n.parentIds ?? [])].sort()) === key &&
          this.coords.has(n),
      );

      const xs = siblings.map((s) => this.coords.get(s)!.x);
      const x = xs.length ? Math.max(...xs) + this.nodeWidth : 0;

      this.coords.set(node, { x, y });
    });
  }
}

export default TreeLayout;

// offsetNodes(offset: { xOffset: number; yOffset: number }) {
//   if (!this.nodes.length) return;

//   const leftmostNode = this.nodes.reduce((prev, curr) => {
//     const prevPos = this.coords.get(prev);
//     const currPos = this.coords.get(curr);
//     if (!prevPos) return curr;
//     if (!currPos) return prev;
//     return prevPos.x < currPos.x ? prev : curr;
//   });

//   const leftmostPos = this.coords.get(leftmostNode);
//   if (!leftmostPos) return;

//   const netXOffset = offset.xOffset - leftmostPos.x;

//   this.nodes.forEach((node) => {
//     const pos = this.coords.get(node);
//     node.xPos = (pos?.x ?? 0) + netXOffset;
//     node.yPos = (pos?.y ?? 0) + offset.yOffset;
//   });
// }
