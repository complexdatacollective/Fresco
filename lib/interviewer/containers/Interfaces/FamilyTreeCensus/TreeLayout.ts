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
    this.nodes = nodes.map((node) => ({ ...node }));
    this.couples = [];
    this.layers = new Map<PlaceholderNodeProps, number>();
    this.coords = new Map<PlaceholderNodeProps, { x: number; y: number }>();
    this.grouped = new Map<number, PlaceholderNodeProps[]>();
    this.layerHeight = 130;
    this.nodeWidth = 130;
    this.byId = new Map(this.nodes.map((n) => [n.id!, n]));
  }

  arrangeNodes(offsets: {
    xOffset: number;
    yOffset: number;
  }): PlaceholderNodeProps[] {
    this.collectCouples();
    this.assignLayers();
    this.groupByLayer();
    this.assignCoordinates();
    this.recenterGrandchildrenAndCouples();
    this.fixOverlaps();
    this.ensureAllNodesHaveCoords();
    this.orderCouplesBySex(this.nodes);
    this.reorderSiblingsByParentSide();
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
    const seen = new Set<string>();
    this.nodes.forEach((node) => {
      const partner = this.partnerOf(node);
      if (!partner) return;
      const key = [node.id, partner.id].sort().join('|');
      if (seen.has(key)) return;
      seen.add(key);
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

  groupSiblings(nodes: PlaceholderNodeProps[]) {
    // Bucket by actual parent couple
    const bucketKey = (n: PlaceholderNodeProps) => {
      const parents = this.parentsOf(n);
      if (parents.length === 0) return `root:${n.id}`;

      // find the couple that are parents of this node
      const parentCouple = this.couples.find(
        ([a, b]) => parents.includes(a) && parents.includes(b),
      );

      if (parentCouple) {
        const [a, b] = parentCouple;
        return `couple:${a.id}|${b.id}`;
      }

      return `parents:${parents
        .map((p) => p.id)
        .sort()
        .join('|')}`;
    };

    const buckets = new Map<string, PlaceholderNodeProps[]>();
    nodes.forEach((n) => {
      const k = bucketKey(n);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(n);
    });

    const bucketList = Array.from(buckets.values()).map((list) => {
      const xs = list.map((n) => this.coords.get(n)!.x);
      const center = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
      return { list, center };
    });

    // Sort buckets left-to-right by center
    bucketList.sort((a, b) => a.center - b.center);

    // Repack: place buckets contiguously, keep members in x-order within bucket
    let cursor = Math.min(...nodes.map((n) => this.coords.get(n)!.x));
    bucketList.forEach(({ list }) => {
      const inOrder = this.orderByX(list); // preserve couple ordering already handled earlier
      inOrder.forEach((n, i) => {
        const { y } = this.coords.get(n)!;
        this.coords.set(n, { x: cursor + i * this.nodeWidth, y });
      });
      cursor += (inOrder.length || 1) * this.nodeWidth;
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

  recenterGrandchildrenAndCouples() {
    for (const [a, b] of this.couples) {
      const sharedChildren = this.childrenOf(a).filter((c) =>
        this.childrenOf(b).includes(c),
      );
      if (!sharedChildren.length) continue;

      const parentX = (this.coords.get(a)!.x + this.coords.get(b)!.x) / 2;
      const childXs = sharedChildren.map((c) => this.coords.get(c)!.x);
      const centroid = childXs.reduce((sum, x) => sum + x, 0) / childXs.length;
      const dx = parentX - centroid;

      for (const child of sharedChildren) {
        const old = this.coords.get(child)!;
        this.coords.set(child, { x: old.x + dx, y: old.y });
      }
    }

    for (const [a, b] of this.couples) {
      const coordA = this.coords.get(a)!;
      const coordB = this.coords.get(b)!;

      const spacing = this.nodeWidth * 0.4;
      const centerX = (coordA.x + coordB.x) / 2;

      this.coords.set(a, { x: centerX - spacing, y: coordA.y });
      this.coords.set(b, { x: centerX + spacing, y: coordB.y });
    }
  }

  private ensureAllNodesHaveCoords() {
    this.nodes.forEach((node) => {
      if (this.coords.has(node)) return;

      // layer = max(parent layer) + 1 (or existing layer if already set)
      const parentLayers = (node.parentIds ?? [])
        .map((pid) => this.byId.get(pid))
        .filter(Boolean)
        .map((p) => this.layers.get(p!) ?? 0);

      const layer = parentLayers.length
        ? Math.max(...parentLayers) + 1
        : (this.layers.get(node) ?? 0);
      const y = layer * this.layerHeight;

      // Siblings = same exact parent set, **and** already placed at this same layer
      const key = JSON.stringify([...(node.parentIds ?? [])].sort());
      const siblings = this.nodes.filter(
        (n) =>
          this.coords.has(n) &&
          (this.layers.get(n) ?? 0) === layer &&
          JSON.stringify([...(n.parentIds ?? [])].sort()) === key,
      );

      const xs = siblings.map((s) => this.coords.get(s)!.x);
      const x = xs.length ? Math.max(...xs) + this.nodeWidth : 0;

      this.coords.set(node, { x, y });
    });
  }

  private reorderSiblingsByParentSide() {
    // helpers
    const layerOf = (n: PlaceholderNodeProps) => this.layers.get(n) ?? -1;
    const getLayer = (k: number) => this.nodes.filter((n) => layerOf(n) === k);
    const unitWidth = (u: PlaceholderNodeProps[]) =>
      u.length === 2 ? this.nodeWidth * 1.8 : this.nodeWidth;
    const unitLeft = (u: PlaceholderNodeProps[]) =>
      Math.min(...u.map((n) => this.coords.get(n)!.x));
    const unitRight = (u: PlaceholderNodeProps[]) =>
      Math.max(...u.map((n) => this.coords.get(n)!.x));
    const unitCenter = (u: PlaceholderNodeProps[]) =>
      (unitLeft(u) + unitRight(u)) / 2;
    const shiftUnit = (u: PlaceholderNodeProps[], dx: number) => {
      u.forEach((n) => {
        const c = this.coords.get(n)!;
        this.coords.set(n, { x: c.x + dx, y: c.y });
      });
    };

    // Work only with layer 1 and 2
    const L1 = getLayer(1);
    const L2 = getLayer(2);
    if (!L1.length) return;

    // Find the "parent couple" at layer 1: the L1 couple with the most shared children on L2
    const l1Couples = this.couples.filter(
      ([a, b]) => L1.includes(a) && L1.includes(b),
    );
    let parentCouple: [PlaceholderNodeProps, PlaceholderNodeProps] | null =
      null;
    let best = -1;

    for (const [a, b] of l1Couples) {
      const shared = this.childrenOf(a).filter((c) =>
        this.childrenOf(b).includes(c),
      );
      const countOnL2 = shared.filter((c) => L2.includes(c)).length;
      if (countOnL2 > best) {
        best = countOnL2;
        parentCouple = [a, b];
      }
    }
    if (!parentCouple) return;

    // Identify mother/father (prefer gender; fallback to current left/right)
    let [m, f] = parentCouple;
    if (m.gender === 'male' && f.gender !== 'male') [m, f] = [f, m];
    if (m.gender !== 'female' && f.gender !== 'male') {
      // fallback: whoever is left on screen is "mother", right is "father"
      const mx = this.coords.get(m)!.x;
      const fx = this.coords.get(f)!.x;
      if (mx > fx) [m, f] = [f, m];
    }

    const motherX = this.coords.get(m)!.x;
    const fatherX = this.coords.get(f)!.x;

    // Grandparents for each side (assumes no single parents per your note)
    const mParents = this.parentsOf(m);
    const fParents = this.parentsOf(f);
    if (mParents.length < 2 || fParents.length < 2) return;

    const hasBoth = (n: PlaceholderNodeProps, pair: PlaceholderNodeProps[]) =>
      pair.every((p) => (n.parentIds ?? []).includes(p.id!));

    // Collect true maternal/paternal siblings (exclude the mother/father themselves)
    const maternalSibs = L1.filter((n) => n !== m && hasBoth(n, mParents));
    const paternalSibs = L1.filter((n) => n !== f && hasBoth(n, fParents));

    if (!maternalSibs.length && !paternalSibs.length) return;

    // TODO: this may begin to get broken with the cousins :/
    // Build "units": each sibling moves with their L1 partner if they have one
    const L1Set = new Set(L1);
    const inCoupleAtL1 = (n: PlaceholderNodeProps) => {
      const p = this.partnerOf(n);
      return p && L1Set.has(p) ? p : null;
    };

    const makeUnits = (people: PlaceholderNodeProps[]) => {
      const used = new Set<PlaceholderNodeProps>();
      const units: PlaceholderNodeProps[][] = [];
      for (const n of people) {
        if (used.has(n)) continue;
        const p = inCoupleAtL1(n);
        if (p) {
          // preserve female-left ordering that orderCouplesBySex already established
          const a =
            n.gender === 'female' ||
            this.coords.get(n)!.x <= this.coords.get(p)!.x
              ? n
              : p;
          const b = a === n ? p : n;
          units.push([a, b]);
          used.add(n);
          used.add(p);
        } else {
          units.push([n]);
          used.add(n);
        }
      }
      return units;
    };

    const maternalUnits = makeUnits(maternalSibs);
    const paternalUnits = makeUnits(paternalSibs);

    // Sort units by current position so we preserve visual order
    maternalUnits.sort((u1, u2) => unitCenter(u1) - unitCenter(u2)); // left -> right
    paternalUnits.sort((u1, u2) => unitCenter(u1) - unitCenter(u2)); // left -> right

    // Pack maternal units from the mother **outwards to the left**
    let cursorLeft = motherX - this.nodeWidth; // first right edge target just left of mother
    for (let i = maternalUnits.length - 1; i >= 0; i--) {
      const u = maternalUnits[i];
      const targetRight = cursorLeft;
      const currentRight = unitRight(u);
      shiftUnit(u, targetRight - currentRight);
      cursorLeft -= unitWidth(u);
    }

    // Pack paternal units from the father **outwards to the right**
    let cursorRight = fatherX + this.nodeWidth; // first left edge target just right of father
    for (let i = 0; i < paternalUnits.length; i++) {
      const u = paternalUnits[i];
      const targetLeft = cursorRight;
      const currentLeft = unitLeft(u);
      shiftUnit(u, targetLeft - currentLeft);
      cursorRight += unitWidth(u);
    }
  }
}

export default TreeLayout;
