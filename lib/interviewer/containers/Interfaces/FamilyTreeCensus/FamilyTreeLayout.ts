type FamilyTreeMember = {
  id: string;
  gender: string;
  partnerId?: string;
  parentIds?: string[];
  childIds?: string[];
  xPos?: number;
  yPos?: number;
};

type TreeSpacing = {
  startX: number;
  startY: number;
  siblings: number;
  partners: number;
  generations: number;
};

class FamilyTreeLayout {
  nodes: FamilyTreeMember[];
  couples: Set<string>;
  layerGroups: Map<number, string[]>;
  spacing: TreeSpacing;

  constructor(
    nodes: FamilyTreeMember[],
    spacing: TreeSpacing = {
      startX: 100,
      startY: 100,
      siblings: 100,
      partners: 80,
      generations: 100,
    },
  ) {
    this.nodes = nodes.map((node) => ({ ...node }));
    this.spacing = spacing;
    this.couples = this.collectCouples();
    this.layerGroups = new Map();
    this.assignLayers();
    this.orderLayerGroups();
    this.assignCoordinates();
    this.offsetCoordinates();
  }

  nodeById(nodeId: string) {
    return this.nodes.find((node) => {
      return node.id === nodeId;
    });
  }

  partnerOf(partnerNode: FamilyTreeMember): FamilyTreeMember | null {
    return this.nodes.find((node) => partnerNode.partnerId == node.id) ?? null;
  }

  // returns the partner's node id if it exists
  partnerId(partnerNodeId: string) {
    return this.nodeById(partnerNodeId)?.partnerId;
  }

  parents(childNodeId: string) {
    const childNode = this.nodeById(childNodeId);
    return this.nodes.filter((node) =>
      (childNode?.parentIds ?? []).includes(node.id),
    );
  }

  // returns an array of the parent node ids
  parentIds(childNodeId: string): string[] {
    return this.parents(childNodeId).map((node) => node.id);
  }

  // returns the couple id for the node's parents
  parentsId(childNodeId: string) {
    const nodeParentIds = this.parentIds(childNodeId);
    return this.coupleId(nodeParentIds[0], nodeParentIds[1]);
  }

  // returns an array of the child node ids
  childrenOf(parentNodeId: string): string[] {
    const parentNode = this.nodeById(parentNodeId);
    if (parentNode == null) return [];
    return this.nodes
      .filter((node) => (parentNode.childIds ?? []).includes(node.id))
      .map((node) => node.id);
  }

  // generate an id for a couple
  coupleId(partner1Id: string, partner2Id: string) {
    return [partner1Id, partner2Id].sort().join('|');
  }

  // returns a set of all couple ids
  collectCouples() {
    const coupleIds = new Set<string>();
    this.nodes.forEach((node) => {
      const partner = this.partnerOf(node);
      if (node?.id && partner?.id) {
        coupleIds.add(this.coupleId(node.id, partner.id));
      }
    });

    return coupleIds;
  }

  nodeLayer(nodeId: string) {
    for (const [layer, nodeIds] of this.layerGroups.entries()) {
      if (nodeIds.includes(nodeId)) {
        return layer;
      }
    }

    return undefined;
  }

  get maxLayer() {
    return this.layerGroups.size - 1;
  }

  // insert/move a node to a layer
  assignNodeLayer(layer: number, nodeId: string) {
    if (!this.layerGroups.has(layer)) {
      this.layerGroups.set(layer, []);
    }

    // remove node from previous layer list if it exists
    const previousLayer = this.nodeLayer(nodeId);
    if (previousLayer != null) {
      const previousGroup = this.layerGroups.get(previousLayer);
      if (previousGroup != null) {
        this.layerGroups.set(
          previousLayer,
          previousGroup.filter((id) => id != nodeId),
        );
      }
    }

    // add node to new layer list
    const layerGroup = this.layerGroups.get(layer);
    if (layerGroup?.includes(nodeId) === false) {
      layerGroup.push(nodeId);
      this.layerGroups.set(layer, layerGroup);
    }
  }

  // designate a layer number for each node
  // layer 0 is the layer with no parents
  assignLayers() {
    const queue: { nodeId: string; layer: number }[] = [];

    this.nodes.forEach((node) => {
      if ((node.parentIds || []).length == 0 && node.id) {
        // handle nodes with no parents
        this.assignNodeLayer(0, node.id);
        queue.push({ nodeId: node.id, layer: 0 });
      }
    });

    while (queue.length > 0) {
      const { nodeId, layer } = queue.shift()!;
      this.childrenOf(nodeId).forEach((childId) => {
        const prev = this.nodeLayer(childId);
        const nextLayer = layer + 1;
        if (prev == null || nextLayer > prev) {
          this.assignNodeLayer(nextLayer, childId);
          queue.push({ nodeId: childId, layer: nextLayer });
        }
      });
    }

    let changed = true;
    while (changed) {
      changed = false;
      this.nodes.forEach((node) => {
        if (node.id == null) return;
        this.childrenOf(node.id).forEach((childId) => {
          const childLayer = this.nodeLayer(childId);
          if (childLayer != null) {
            const desiredLayer = childLayer - 1;
            const prevLayer = this.nodeLayer(node.id);
            if (prevLayer == null || prevLayer < desiredLayer) {
              this.assignNodeLayer(desiredLayer, node.id);
              changed = true;
            }
          }
        });
      });
    }

    // assign couples to the same layer
    this.couples.forEach((couple) => {
      const [a, b] = couple.split('|');
      const aLayer = this.nodeLayer(a);
      const bLayer = this.nodeLayer(b);

      if (aLayer != null && bLayer == null) {
        this.assignNodeLayer(aLayer, b);
      } else if (bLayer != null && aLayer == null) {
        this.assignNodeLayer(bLayer, a);
      } else if (aLayer != null && bLayer != null && aLayer != bLayer) {
        const target = Math.max(aLayer, bLayer);
        this.assignNodeLayer(target, a);
        this.assignNodeLayer(target, b);
      }
    });
  }

  // assign ordinal positions to nodes in each layer based on relationship
  // position couples next to each other, female first
  // group siblings and their partners together
  orderLayerGroups() {
    if (this.maxLayer === -1) return;
    type Couple = {
      coupleId: string;
      leftPartnerId: string;
      leftParentsId: string;
      rightPartnerId: string;
      rightParentsId: string;
    };
    // captures the order of parent ids on the previous (higher) layer
    // so that the current layer's couples can be ordered correctly
    let lastLevelParentIds = new Set<string>();
    // iterate from the lowest to the highest layer
    [...Array(this.maxLayer + 1).keys()].reverse().forEach((layer) => {
      const currentNodesAtLayer = this.layerGroups.get(layer);
      // map parents id to units
      const solos = new Map<string, string[]>();
      const couples = new Map<string, Couple[]>();
      const placed = new Set<string>();
      // parentIds captures the set of parents of this layer's members
      const parentIds: string[] = [];
      currentNodesAtLayer?.forEach((nodeId) => {
        if (placed.has(nodeId)) return;
        const node = this.nodeById(nodeId);
        const partnerId = this.partnerId(nodeId);

        if (partnerId) {
          // order each couple by female, male
          const couple: string[] =
            node?.gender === 'male' ? [partnerId, nodeId] : [nodeId, partnerId];
          const leftParentsId = this.parentsId(couple[0]);
          const rightParentsId = this.parentsId(couple[1]);
          if (couples.get(leftParentsId) == null) {
            couples.set(leftParentsId, []);
          }
          if (couples.get(rightParentsId) == null) {
            couples.set(rightParentsId, []);
          }
          const coupleData = {
            coupleId: this.coupleId(nodeId, partnerId),
            leftPartnerId: couple[0],
            leftParentsId: leftParentsId,
            rightPartnerId: couple[1],
            rightParentsId: rightParentsId,
          };
          couples.get(leftParentsId)?.push(coupleData);
          if (
            parentIds.includes(rightParentsId) &&
            !parentIds.includes(leftParentsId)
          ) {
            // insert left parents id before right parents id
            const targetIndex = parentIds.indexOf(rightParentsId);
            parentIds.splice(targetIndex, 0, leftParentsId);
          } else if (!parentIds.includes(leftParentsId)) {
            parentIds.push(leftParentsId);
          }
          if (rightParentsId !== leftParentsId) {
            couples.get(rightParentsId)?.push(coupleData);
            if (
              parentIds.includes(leftParentsId) &&
              !parentIds.includes(rightParentsId)
            ) {
              // insert right parents id after left parents id
              const targetIndex = parentIds.indexOf(leftParentsId);
              parentIds.splice(targetIndex + 1, 0, rightParentsId);
            } else if (!parentIds.includes(rightParentsId)) {
              parentIds.push(rightParentsId);
            }
          }
          placed.add(partnerId);
        } else {
          const parentsId = this.parentsId(nodeId);
          if (solos.get(parentsId) == null) solos.set(parentsId, []);
          solos.get(parentsId)?.push(nodeId);
          if (!parentIds.includes(parentsId)) parentIds.push(parentsId);
        }
        placed.add(nodeId);
      });
      const orderedNodesAtLayer = [];
      const placedCouples = new Set<string>();
      // parentIds captures the order of parents of this layer's members
      const orderedParentIds = new Set<string>();
      // add solo and couple members in order of parent id
      parentIds.forEach((id) => {
        // add solo members first
        orderedNodesAtLayer.push(...(solos.get(id) ?? []));
        orderedParentIds.add(id);
        // next add couples in order corresponding to their children's order,
        // followed by couples with no children
        // relatedCouples are couples where one of the partners shares parents
        let relatedCouples = couples.get(id);
        lastLevelParentIds.forEach((coupleId) => {
          // separate the couples that fit the ordered couple id
          const matchedCouples = relatedCouples?.filter((couple) => {
            return couple.coupleId === coupleId;
          });
          matchedCouples?.forEach((couple) => {
            if (placedCouples.has(couple.coupleId)) return;
            orderedNodesAtLayer.push(
              couple.leftPartnerId,
              couple.rightPartnerId,
            );
            placedCouples.add(couple.coupleId);
            orderedParentIds.add(couple.leftParentsId);
            orderedParentIds.add(couple.rightParentsId);
          });
          // keep the remaining couples
          relatedCouples = relatedCouples?.filter((couple) => {
            return couple.coupleId !== coupleId;
          });
        });
        // add any remaining couples that don't have children
        relatedCouples?.forEach((couple) => {
          if (placedCouples.has(couple.coupleId)) return;
          orderedNodesAtLayer.push(couple.leftPartnerId, couple.rightPartnerId);
          placedCouples.add(couple.coupleId);
          orderedParentIds.add(couple.leftParentsId);
        });
      });
      lastLevelParentIds = orderedParentIds;
      this.layerGroups.set(layer, orderedNodesAtLayer);
    });
  }

  assignCoordinates() {
    const placed = new Set<string>();
    [...Array(this.maxLayer + 1).keys()].reverse().forEach((layer) => {
      const y = layer * this.spacing.generations;
      let nextX = 0;
      this.layerGroups.get(layer)?.forEach((nodeId) => {
        if (placed.has(nodeId)) return;
        const node = this.nodeById(nodeId);
        if (node == null) return;
        node.yPos = y;
        const partnerId = this.partnerId(nodeId);
        if (partnerId) {
          // couple
          const partner = this.nodeById(partnerId);
          const sharedChildIds = this.childrenOf(nodeId).filter((childId) =>
            this.childrenOf(partnerId).includes(childId),
          );
          if (partner) {
            if (sharedChildIds.length > 0) {
              // have children
              const childXs = Array.from(sharedChildIds)
                .map((childId) => this.nodeById(childId)?.xPos)
                .filter((x): x is number => x != null);
              const centerX =
                childXs.reduce((a, b) => a + b, 0) / childXs.length;
              node.xPos = centerX - this.spacing.partners / 2;
              partner.xPos = centerX + this.spacing.partners / 2;
              if (nextX > 0) {
                node.xPos = Math.max(nextX, node.xPos);
                partner.xPos = Math.max(
                  nextX + this.spacing.partners,
                  partner.xPos,
                );
              }
              partner.yPos = y;
              placed.add(nodeId);
              placed.add(partnerId);
              nextX = partner.xPos + this.spacing.siblings;
            } else {
              // no children
              node.xPos = nextX;
              partner.xPos = nextX + this.spacing.partners;
              partner.yPos = y;
              placed.add(nodeId);
              placed.add(partnerId);
              nextX = partner.xPos + this.spacing.siblings;
            }
          }
        } else {
          // solo
          if (this.childrenOf(nodeId).length > 0) {
            // has children
          } else {
            // no children
            node.xPos = nextX;
            placed.add(nodeId);
            nextX = node.xPos + this.spacing.siblings;
          }
        }
      });
    });
  }

  offsetCoordinates() {
    this.nodes.forEach((node) => {
      node.xPos! += this.spacing.startX;
      node.yPos! += this.spacing.startY;
    });
  }
}

export default FamilyTreeLayout;
