import { FAMILY_TREE_CONFIG } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/config';

type Relationship = 'parent' | 'partner' | 'ex-partner';

export type LayoutNode = {
  isEgo?: boolean;
  sex?: 'male' | 'female';
};

export type LayoutEdge = {
  source: string;
  target: string;
  relationship: Relationship;
};

type TreeSpacing = {
  siblings: number;
  partners: number;
  generations: number;
};

type LayoutResult = Map<string, { x: number; y: number }>;

const DEFAULT_SPACING: TreeSpacing = {
  siblings: FAMILY_TREE_CONFIG.siblingSpacing,
  partners: FAMILY_TREE_CONFIG.partnerSpacing,
  generations: FAMILY_TREE_CONFIG.rowHeight,
};

export function layoutFamilyTree(
  nodes: Map<string, LayoutNode>,
  edges: Map<string, LayoutEdge>,
  spacing: TreeSpacing = DEFAULT_SPACING,
): LayoutResult {
  const positions = new Map<string, { x: number; y: number }>();

  // Build helper functions from the graph data
  const getRelationship = (
    nodeId: string,
    relationship: Relationship,
  ): string | null => {
    for (const edge of Array.from(edges.values())) {
      if (edge.source === nodeId && edge.relationship === relationship) {
        return edge.target;
      }
      if (edge.target === nodeId && edge.relationship === relationship) {
        return edge.source;
      }
    }
    return null;
  };

  const getPartner = (id: string) => getRelationship(id, 'partner');
  const getExPartner = (id: string) => getRelationship(id, 'ex-partner');

  const getParentToChildrenMap = (): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    for (const edge of Array.from(edges.values())) {
      if (edge.relationship === 'parent') {
        if (!map.has(edge.source)) {
          map.set(edge.source, []);
        }
        map.get(edge.source)!.push(edge.target);
      }
    }
    return map;
  };

  const getChildren = (nodeId: string): string[] => {
    const map = getParentToChildrenMap();
    return map.get(nodeId) ?? [];
  };

  const getParents = (nodeId: string): string[] => {
    const parents: string[] = [];
    for (const edge of Array.from(edges.values())) {
      if (edge.relationship === 'parent' && edge.target === nodeId) {
        parents.push(edge.source);
      }
    }
    return parents;
  };

  const getSharedChildren = (nodeId1: string, nodeId2: string): string[] => {
    const children1 = getChildren(nodeId1);
    const children2 = getChildren(nodeId2);
    return children1.filter((id) => children2.includes(id));
  };

  const getNodeById = (id: string) => nodes.get(id);

  // Find ego node
  const egoId = Array.from(nodes.entries()).find(([, node]) => node.isEgo)?.[0];
  if (!egoId) {
    // eslint-disable-next-line no-console
    console.warn('No ego node found for layout');
    return positions;
  }

  // Assign nodes to layers (generations)
  const layers = new Map<number, string[]>();
  const nodeToLayer = new Map<string, number>();
  const visited = new Set<string>();

  // BFS to assign layers starting from nodes with no parents
  const queue: { nodeId: string; layer: number }[] = [];

  // Find root nodes (no parents)
  for (const [nodeId] of Array.from(nodes.entries())) {
    if (getParents(nodeId).length === 0) {
      queue.push({ nodeId, layer: 0 });
    }
  }

  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;

    if (visited.has(nodeId)) {
      // Update layer if this is a deeper level
      const currentLayer = nodeToLayer.get(nodeId);
      if (currentLayer !== undefined && layer > currentLayer) {
        // Remove from old layer
        const oldLayerNodes = layers.get(currentLayer) ?? [];
        layers.set(
          currentLayer,
          oldLayerNodes.filter((id) => id !== nodeId),
        );

        // Add to new layer
        nodeToLayer.set(nodeId, layer);
        if (!layers.has(layer)) layers.set(layer, []);
        layers.get(layer)!.push(nodeId);
      }
      continue;
    }

    visited.add(nodeId);
    nodeToLayer.set(nodeId, layer);

    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer)!.push(nodeId);

    // Add children to next layer
    getChildren(nodeId).forEach((childId) => {
      queue.push({ nodeId: childId, layer: layer + 1 });
    });
  }

  for (const [nodeId] of Array.from(nodes.entries())) {
    const partnerId = getPartner(nodeId);
    const exPartnerId = getExPartner(nodeId);

    // Combine both partner types into a single array for iteration
    const relatedPartners = [partnerId, exPartnerId].filter(
      (id): id is string => !!id,
    );

    for (const relatedPartnerId of relatedPartners) {
      const nodeLayer = nodeToLayer.get(nodeId);
      const partnerLayer = nodeToLayer.get(relatedPartnerId);

      if (
        nodeLayer !== undefined &&
        partnerLayer !== undefined &&
        nodeLayer !== partnerLayer
      ) {
        const targetLayer = Math.max(nodeLayer, partnerLayer);

        // Move both to the deeper layer
        [nodeId, relatedPartnerId].forEach((id) => {
          const oldLayer = nodeToLayer.get(id)!;
          if (oldLayer !== targetLayer) {
            // Remove from old layer
            const oldLayerNodes = layers.get(oldLayer) ?? [];
            layers.set(
              oldLayer,
              oldLayerNodes.filter((layerId) => layerId !== id),
            );

            // Add to target layer
            nodeToLayer.set(id, targetLayer);
            if (!layers.has(targetLayer)) layers.set(targetLayer, []);
            layers.get(targetLayer)!.push(id);
          }
        });
      }
    }
  }

  // Enforce child layers >= parent layer + 1
  // propagate downwards so grandchildren are moved
  const parentToChildren = getParentToChildrenMap();

  // seed with all parents that have children
  const propagateQueue: string[] = Array.from(parentToChildren.keys());

  while (propagateQueue.length > 0) {
    const parentId = propagateQueue.shift()!;
    const parentLayer = nodeToLayer.get(parentId);
    if (parentLayer === undefined) continue;

    const children = parentToChildren.get(parentId) ?? [];
    for (const childId of children) {
      // ensure child layer is one greater than parent layer
      const childLayer = nodeToLayer.get(childId) ?? parentLayer + 1;
      if (childLayer <= parentLayer) {
        const newChildLayer = parentLayer + 1;

        // remove from old layer assignment (if present)
        const oldLayer = nodeToLayer.get(childId);
        if (oldLayer !== undefined) {
          const oldList = layers.get(oldLayer) ?? [];
          layers.set(
            oldLayer,
            oldList.filter((id) => id !== childId),
          );
        }

        // set child's new layer and add to layers map
        nodeToLayer.set(childId, newChildLayer);
        if (!layers.has(newChildLayer)) layers.set(newChildLayer, []);
        layers.get(newChildLayer)!.push(childId);

        // enqueue child so its own children (grandchildren) will be checked
        propagateQueue.push(childId);
      }
    }
  }

  // Determine side ('maternal', 'paternal', or 'neutral') for each node
  const sides = new Map<string, 'maternal' | 'paternal' | 'neutral'>();
  const motherId = 'mother';
  const fatherId = 'father';

  sides.set(motherId, 'maternal');
  sides.set(fatherId, 'paternal');

  // Parent's siblings (aunts/uncles)
  const addSideToParentSiblings = (
    parentId: string,
    side: 'maternal' | 'paternal',
  ) => {
    if (!parentId) return;
    const grandParents = getParents(parentId);
    if (grandParents.length === 0) return;

    // Find siblings: all other children of the same grandparents
    for (const [nodeId] of Array.from(nodes.entries())) {
      const nodeParents = getParents(nodeId);
      if (
        nodeParents.length > 0 &&
        nodeParents.sort().join('|') === grandParents.sort().join('|')
      ) {
        sides.set(nodeId, side);
      }
    }
  };

  addSideToParentSiblings(motherId, 'maternal');
  addSideToParentSiblings(fatherId, 'paternal');

  // Propagate sides to their partners and descendants
  const propagateSide = (startIds: string[], side: 'maternal' | 'paternal') => {
    const queue = [...startIds];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      sides.set(nodeId, side);
      const partner = getPartner(nodeId);
      const exPartner = getExPartner(nodeId);
      const related = [partner, exPartner, ...getChildren(nodeId)].filter(
        Boolean,
      );
      queue.push(...related);
    }
  };

  const maternalRoots = Array.from(sides.entries())
    .filter(([, side]) => side === 'maternal')
    .map(([id]) => id);
  const paternalRoots = Array.from(sides.entries())
    .filter(([, side]) => side === 'paternal')
    .map(([id]) => id);
  propagateSide(maternalRoots, 'maternal');
  propagateSide(paternalRoots, 'paternal');

  // Order nodes within each layer based on family relationships
  const maxLayer = Math.max(...Array.from(layers.keys()));

  // Process layers from youngest to oldest
  for (let layer = maxLayer; layer >= 0; layer--) {
    const layerNodes = layers.get(layer) ?? [];
    if (layerNodes.length === 0) continue;

    type Couple = {
      coupleId: string;
      leftPartnerId: string;
      leftParentsId: string;
      rightPartnerId: string;
      rightParentsId: string;
    };

    // Map parent IDs to their children (solos and couples)
    const solos = new Map<string, string[]>();
    const couples = new Map<string, Couple[]>();
    const placed = new Set<string>();
    const parentIds: string[] = [];

    // Helper to create couple ID
    const coupleId = (id1: string, id2: string) => [id1, id2].sort().join('|');

    // Helper to get parents' couple ID
    const getParentsId = (nodeId: string): string => {
      const parents = getParents(nodeId);
      return parents.sort().join('|');
    };

    // Group nodes by their parents
    for (const nodeId of layerNodes) {
      if (placed.has(nodeId)) continue;

      const partnerId = getPartner(nodeId);

      if (partnerId && layerNodes.includes(partnerId)) {
        // Handle couple
        const node = getNodeById(nodeId);
        const partnerNode = getNodeById(partnerId);

        let leftId = nodeId;
        let rightId = partnerId;

        if (node?.isEgo) {
          leftId = nodeId;
          rightId = partnerId;
        } else if (partnerNode?.isEgo) {
          leftId = partnerId;
          rightId = nodeId;
        } else {
          const nodeIsMale = node?.sex === 'male';
          leftId = nodeIsMale ? partnerId : nodeId;
          rightId = nodeIsMale ? nodeId : partnerId;
        }

        placed.add(nodeId);
        placed.add(partnerId);

        const leftParentsId = getParentsId(leftId);
        const rightParentsId = getParentsId(rightId);
        const effectiveLeftParentsId =
          leftParentsId === '' ? rightParentsId : leftParentsId;
        const effectiveRightParentsId =
          rightParentsId === '' ? leftParentsId : rightParentsId;

        if (!couples.has(effectiveLeftParentsId)) {
          couples.set(effectiveLeftParentsId, []);
        }
        if (!couples.has(effectiveRightParentsId)) {
          couples.set(effectiveRightParentsId, []);
        }

        const coupleData: Couple = {
          coupleId: coupleId(leftId, rightId),
          leftPartnerId: leftId,
          leftParentsId: effectiveLeftParentsId,
          rightPartnerId: rightId,
          rightParentsId: effectiveRightParentsId,
        };

        couples.get(effectiveLeftParentsId)?.push(coupleData);

        // Track parent IDs order
        if (
          parentIds.includes(effectiveRightParentsId) &&
          !parentIds.includes(effectiveLeftParentsId)
        ) {
          const targetIndex = parentIds.indexOf(effectiveRightParentsId);
          parentIds.splice(targetIndex, 0, effectiveLeftParentsId);
        } else if (!parentIds.includes(effectiveLeftParentsId)) {
          parentIds.push(effectiveLeftParentsId);
        }

        if (effectiveRightParentsId !== effectiveLeftParentsId) {
          couples.get(effectiveRightParentsId)?.push(coupleData);
          if (
            parentIds.includes(effectiveLeftParentsId) &&
            !parentIds.includes(effectiveRightParentsId)
          ) {
            const targetIndex = parentIds.indexOf(effectiveLeftParentsId);
            parentIds.splice(targetIndex + 1, 0, effectiveRightParentsId);
          } else if (!parentIds.includes(effectiveRightParentsId)) {
            parentIds.push(effectiveRightParentsId);
          }
        }
      } else {
        // Handle solo node
        const parentsId = getParentsId(nodeId);
        if (!solos.has(parentsId)) solos.set(parentsId, []);
        solos.get(parentsId)?.push(nodeId);
        if (!parentIds.includes(parentsId)) parentIds.push(parentsId);
        placed.add(nodeId);
      }
    }

    // Build ordered list based on parent relationships
    const orderedNodes: string[] = [];

    for (const parentId of parentIds) {
      // Add solo children
      orderedNodes.push(...(solos.get(parentId) ?? []));

      // Add all couples
      const couplesForParent = couples.get(parentId) ?? [];
      for (const couple of couplesForParent) {
        if (!orderedNodes.includes(couple.leftPartnerId))
          orderedNodes.push(couple.leftPartnerId);
        if (!orderedNodes.includes(couple.rightPartnerId))
          orderedNodes.push(couple.rightPartnerId);
      }
    }

    // Global side sort (maternal left, neutral center, paternal right)
    orderedNodes.sort((a, b) => {
      const sideOrder = { maternal: -1, neutral: 0, paternal: 1 };
      const sideA = sides.get(a) ?? 'neutral';
      const sideB = sides.get(b) ?? 'neutral';
      return sideOrder[sideA] - sideOrder[sideB];
    });

    layers.set(layer, orderedNodes);
  }

  // Assign coordinates
  const placedNodes = new Set<string>();

  for (let layer = maxLayer; layer >= 0; layer--) {
    const layerNodes = layers.get(layer) ?? [];
    const y = layer * spacing.generations;
    let nextX = 0;

    for (let i = 0; i < layerNodes.length; i++) {
      const nodeId = layerNodes[i];
      if (!nodeId || placedNodes.has(nodeId)) continue;

      const partnerId = getPartner(nodeId);
      if (partnerId && layerNodes.includes(partnerId)) {
        const nodeData = getNodeById(nodeId);

        let leftPartnerId: string;
        let rightPartnerId: string;

        if (nodeData?.isEgo) {
          // ego always on consistent side
          leftPartnerId = nodeId;
          rightPartnerId = partnerId;
        } else {
          // normal couple rule
          leftPartnerId = nodeData?.sex === 'male' ? partnerId : nodeId;
          rightPartnerId = leftPartnerId === nodeId ? partnerId : nodeId;
        }

        const leftExId = getExPartner(leftPartnerId);
        const rightExId = getExPartner(rightPartnerId);

        const sharedChildren = getSharedChildren(leftPartnerId, rightPartnerId);

        // center the couple around their children, if any
        let centerX: number | undefined;
        if (sharedChildren.length > 0) {
          const childXs = sharedChildren
            .map((c) => positions.get(c)?.x)
            .filter((x): x is number => x !== undefined);
          if (childXs.length > 0)
            centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
        }

        // reserve space for exes
        const leftReserve = leftExId ? spacing.partners : 0;
        const rightReserve = rightExId ? spacing.partners : 0;

        // base placement
        let leftX =
          typeof centerX === 'number'
            ? centerX - spacing.partners / 2
            : nextX + leftReserve;
        let rightX = leftX + spacing.partners;

        if (leftX < nextX + leftReserve) {
          const shift = nextX + leftReserve - leftX;
          leftX += shift;
          rightX += shift;
        }

        positions.set(leftPartnerId, { x: leftX, y });
        positions.set(rightPartnerId, { x: rightX, y });
        placedNodes.add(leftPartnerId);
        placedNodes.add(rightPartnerId);

        // ex-partners
        if (leftExId) {
          positions.set(leftExId, { x: leftX - spacing.partners, y });
          placedNodes.add(leftExId);
        }
        if (rightExId) {
          positions.set(rightExId, { x: rightX + spacing.partners, y });
          placedNodes.add(rightExId);
        }

        nextX = rightX + rightReserve + spacing.siblings;
        i++; // skip partner
      } else {
        // single nodes
        const children = getChildren(nodeId);
        const childXs = children
          .map((c) => positions.get(c)?.x)
          .filter((x): x is number => x !== undefined);

        if (childXs.length > 0) {
          const centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
          positions.set(nodeId, { x: Math.max(nextX, centerX), y });
          nextX = Math.max(
            nextX + spacing.siblings,
            centerX + spacing.siblings,
          );
        } else {
          positions.set(nodeId, { x: nextX, y });
          nextX += spacing.siblings;
        }

        placedNodes.add(nodeId);
      }
    }
  }

  // Normalize coordinates (move leftmost to x=0)
  const allPositions = Array.from(positions.values());
  if (allPositions.length > 0) {
    const minX = Math.min(...allPositions.map((pos) => pos.x));
    if (minX < 0) {
      for (const [nodeId, pos] of Array.from(positions.entries())) {
        positions.set(nodeId, { x: pos.x - minX, y: pos.y });
      }
    }
  }

  return positions;
}
