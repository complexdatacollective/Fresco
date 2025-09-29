type FamilyTreeMember = {
  id: string;
  isEgo: boolean | undefined;
  gender: string;
  label: string;
  partnerId?: string;
  exPartnerId?: string;
  parentIds?: string[];
  childIds?: string[];
  xPos?: number;
  yPos?: number;
};

type TreeSpacing = {
  siblings: number;
  partners: number;
  generations: number;
};

class FamilyTreeLayout {
  // contains all nodes to be placed
  nodes: FamilyTreeMember[];
  couples: Set<string>;
  layerGroups: Map<number, string[]>;
  spacing: TreeSpacing;

  constructor(
    nodes: FamilyTreeMember[],
    spacing: TreeSpacing = {
      siblings: 100,
      partners: 80,
      generations: 100,
    },
    skipAutomaticProcessing = false,
  ) {
    this.nodes = nodes.map((node) => ({ ...node }));
    this.nodes.forEach((node) => {
      node.xPos = undefined;
      node.yPos = undefined;
    });
    this.spacing = spacing;
    this.couples = this.collectCouples();
    this.layerGroups = new Map();
    if (skipAutomaticProcessing == false) {
      this.assignLayers();
      this.orderLayerGroups();
      this.insertHalfSiblings();
      this.insertCousins();
      this.assignCoordinates();
      this.adjustXCoordinates();
    }
  }

  get ego() {
    return this.nodes.find((node) => node.isEgo);
  }

  nodeById(nodeId: string) {
    return this.nodes.find((node) => {
      return node.id === nodeId;
    });
  }

  partnerOf(partnerNode: FamilyTreeMember): FamilyTreeMember | null {
    return this.nodes.find((node) => partnerNode.partnerId == node.id) ?? null;
  }

  exPartnerOf(partnerNode: FamilyTreeMember): FamilyTreeMember | null {
    return (
      this.nodes.find((node) => partnerNode.exPartnerId == node.id) ?? null
    );
  }

  // returns the partner's node id if it exists
  partnerId(partnerNodeId: string) {
    return this.nodeById(partnerNodeId)?.partnerId;
  }

  // returns the ex partner's node id if it exists
  exPartnerId(partnerNodeId: string) {
    return this.nodeById(partnerNodeId)?.exPartnerId;
  }

  // returns true if node has an ex partner and no parents
  isEx(nodeId: string) {
    return (
      this.parentIds(nodeId).length === 0 && this.exPartnerId(nodeId) != null
    );
  }

  // returns true if node has parents who are exes
  isHalf(nodeId: string) {
    const parents = this.parents(nodeId);
    return (
      parents[0]?.exPartnerId != null &&
      parents[1]?.exPartnerId != null &&
      parents[0].id === parents[1].exPartnerId &&
      parents[0].exPartnerId === parents[1].id
    );
  }

  // returns true if node is an aunt/uncle to ego
  isAuntUncle(nodeId: string) {
    if (this.ego == null) return false;

    return this.parentIds(this.ego.id)
      .flatMap((parentId) => this.fullSiblingIds(parentId))
      .includes(nodeId);
  }

  // returns true if node has a parent who is an aunt/uncle
  isCousin(nodeId: string) {
    if (this.ego == null) return false;

    return this.parentIds(nodeId).some((parentId) => {
      return this.isAuntUncle(parentId);
    });
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

  fullSiblingIds(nodeId: string) {
    const parentIds = this.parentIds(nodeId);
    const parent1ChildIds = this.childrenOf(parentIds[0]!);
    const parent2ChildIds = this.childrenOf(parentIds[1]!);

    return parent1ChildIds.filter(
      (childId) => childId !== nodeId && parent2ChildIds.includes(childId),
    );
  }

  // returns the couple id for the node's parents
  parentsId(childNodeId: string) {
    const nodeParentIds = this.parentIds(childNodeId);
    return this.coupleId(nodeParentIds[0]!, nodeParentIds[1]!);
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
  // (and not partner or ex-partner in another layer)
  assignLayers() {
    const queue: { nodeId: string; layer: number }[] = [];

    this.nodes.forEach((node) => {
      if (
        this.isEx(node.id) ||
        this.isHalf(node.id) ||
        this.isCousin(node.id)
      ) {
        return;
      }
      if ((node.parentIds ?? []).length == 0 && node.id) {
        // handle nodes with no parents
        this.assignNodeLayer(0, node.id);
        queue.push({ nodeId: node.id, layer: 0 });
      }
    });

    while (queue.length > 0) {
      const { nodeId, layer } = queue.shift()!;
      this.childrenOf(nodeId).forEach((childId) => {
        if (this.isHalf(childId) || this.isCousin(childId)) return;
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
        if (
          this.isEx(node.id) ||
          this.isHalf(node.id) ||
          this.isCousin(node.id)
        )
          return;
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
      const aLayer = this.nodeLayer(a!);
      const bLayer = this.nodeLayer(b!);

      if (aLayer != null && bLayer == null) {
        this.assignNodeLayer(aLayer, b!);
      } else if (bLayer != null && aLayer == null) {
        this.assignNodeLayer(bLayer, a!);
      } else if (aLayer != null && bLayer != null && aLayer != bLayer) {
        const target = Math.max(aLayer, bLayer);
        this.assignNodeLayer(target, a!);
        this.assignNodeLayer(target, b!);
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
    // captures the order of parent ids on the previous (younger) layer
    // so that the current layer's couples can be ordered correctly
    let lastLevelParentIds = new Set<string>();
    // iterate from the youngest to the oldest layer
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
        let couple: string[] = [];
        if (partnerId) {
          // order each couple by sex
          couple =
            node?.gender === 'male' ? [partnerId, nodeId] : [nodeId, partnerId];
          placed.add(partnerId);
          let leftParentsId = this.parentsId(couple[0]!);
          let rightParentsId = this.parentsId(couple[1]!);
          leftParentsId =
            leftParentsId === '|' ? rightParentsId : leftParentsId;
          rightParentsId =
            rightParentsId === '|' ? leftParentsId : rightParentsId;
          if (couples.get(leftParentsId) == null) {
            couples.set(leftParentsId, []);
          }
          if (couples.get(rightParentsId) == null) {
            couples.set(rightParentsId, []);
          }
          const coupleData = {
            coupleId: this.coupleId(couple[0]!, couple[1]!),
            leftPartnerId: couple[0]!,
            leftParentsId: leftParentsId,
            rightPartnerId: couple[1]!,
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
        } else {
          // solo: no partner
          const parentsId = this.parentsId(nodeId);
          if (parentIds != null) {
            if (solos.get(parentsId) == null) solos.set(parentsId, []);
            solos.get(parentsId)?.push(nodeId);
            if (!parentIds.includes(parentsId)) parentIds.push(parentsId);
          }
        }
        placed.add(nodeId);
      });
      const orderedNodesAtLayer = new Array<string>();
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
          // separate the couples that fit the ordered couple id from the children's layer
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
            return (
              couple.coupleId !== coupleId &&
              !placedCouples.has(couple.coupleId)
            );
          });
        });
        // add any remaining couples that don't have children
        relatedCouples?.forEach((couple) => {
          // find the first sibling of either partner
          const targetIndex = orderedNodesAtLayer.findIndex((nodeId) => {
            const parentsId = this.parentsId(nodeId);
            return (
              parentsId === couple.leftParentsId ||
              parentsId === couple.rightParentsId
            );
          });

          if (targetIndex > -1) {
            // found a sibling of one of the couple's partners
            const siblingId = orderedNodesAtLayer[targetIndex];
            // if there's a partner to the left, insert couple to the right
            const siblingPartnerId = orderedNodesAtLayer[targetIndex - 1];
            const siblingPartner = this.nodeById(siblingPartnerId!);
            if (siblingPartner && siblingPartner.partnerId === siblingId) {
              orderedNodesAtLayer.splice(
                targetIndex + 1,
                0,
                couple.leftPartnerId,
                couple.rightPartnerId,
              );
            } else {
              orderedNodesAtLayer.splice(
                targetIndex,
                0,
                couple.leftPartnerId,
                couple.rightPartnerId,
              );
            }
          } else {
            orderedNodesAtLayer.push(
              couple.leftPartnerId,
              couple.rightPartnerId,
            );
          }
          placedCouples.add(couple.coupleId);
          orderedParentIds.add(couple.leftParentsId);
        });
      });
      lastLevelParentIds = orderedParentIds;
      this.layerGroups.set(layer, orderedNodesAtLayer);
      this.insertExPartners(orderedNodesAtLayer);
    });
  }

  // place ex partners on the correct side of existing partners
  insertExPartners(orderedNodesAtLayer: string[]) {
    const exPartners = this.nodes.filter((node) => {
      const partnerId = this.exPartnerId(node.id);
      return (
        !orderedNodesAtLayer.includes(node.id) &&
        this.isEx(node.id) &&
        orderedNodesAtLayer.includes(partnerId!)
      );
    });
    exPartners?.forEach((ex) => {
      const partnerId = ex?.exPartnerId;
      if (ex && partnerId) {
        // find index of partner, insert male ex to left, female to right
        const partnerIndex = orderedNodesAtLayer.indexOf(partnerId);
        if (ex.gender === 'male') {
          orderedNodesAtLayer.splice(partnerIndex, 0, ex.id);
        } else {
          orderedNodesAtLayer.splice(partnerIndex + 1, 0, ex.id);
        }
      }
    });
  }

  // place half siblings in order based on their parents
  insertHalfSiblings() {
    if (this.ego == null) return;
    const egoLayer = this.nodeLayer(this.ego.id);
    const egoMother = this.parents(this.ego.id).find(
      (parent) => parent.gender === 'female',
    );
    const egoFather = this.parents(this.ego.id).find(
      (parent) => parent.gender === 'male',
    );
    if (egoLayer == null) return;
    const orderedNodesAtLayer = this.layerGroups.get(egoLayer)!;
    // maternal half siblings to the left of self and full siblings, paternal to the right
    if (egoMother) {
      const maternalHalfSiblings = this.nodes.filter((node) => {
        return (
          this.isHalf(node.id) &&
          this.parentIds(node.id).includes(egoMother?.id)
        );
      });
      const leftmostFullSiblingIndex = orderedNodesAtLayer?.findIndex((node) =>
        this.parents(node).includes(egoMother),
      );
      maternalHalfSiblings.forEach((halfSibling) => {
        orderedNodesAtLayer.splice(leftmostFullSiblingIndex, 0, halfSibling.id);
      });
    }
    if (egoFather) {
      const paternalHalfSiblings = this.nodes.filter((node) => {
        return (
          this.isHalf(node.id) &&
          this.parentIds(node.id).includes(egoFather?.id)
        );
      });
      const rightmostFullSiblingIndex =
        orderedNodesAtLayer.length -
        orderedNodesAtLayer
          ?.toReversed()
          .findIndex((node) => this.parents(node).includes(egoFather));
      paternalHalfSiblings.forEach((halfSibling) => {
        orderedNodesAtLayer.splice(
          rightmostFullSiblingIndex + 1,
          0,
          halfSibling.id,
        );
      });
    }
  }

  insertCousins() {
    if (this.ego == null) return;

    const placedCousins = new Set<string>();
    const egoLayer = this.nodeLayer(this.ego.id)!;
    const orderedIds = this.layerGroups.get(egoLayer)!;
    const cousins = this.nodes.filter((node) => this.isCousin(node.id));
    const cousinParentIds = cousins.flatMap((cousin) =>
      this.parentIds(cousin.id),
    );
    const parentsLayer = this.nodeLayer(this.parentIds(this.ego.id)[0]!)!;
    const orderedParentLayerIds = this.layerGroups.get(parentsLayer);

    orderedParentLayerIds?.forEach((parentLayerId, index) => {
      let targetIndex = 0;
      // find the first id associated with a cousin
      if (cousinParentIds.includes(parentLayerId)) {
        // find the rightmost previous parent's rightmost child and insert after
        const previousParentId = orderedParentLayerIds
          .slice(0, index)
          .findLast((parentLayerId) => this.nodeById(parentLayerId)!.parentIds);
        if (previousParentId == null) {
          targetIndex = 0;
        } else {
          const previousChildIds = this.childrenOf(previousParentId);
          targetIndex = orderedIds.findLastIndex((id) =>
            previousChildIds.includes(id),
          );
          const partnerId = orderedIds[targetIndex + 1];
          const partner = this.nodeById(partnerId!);
          if (
            (partner && partner.partnerId === orderedIds[targetIndex]) ||
            partner?.exPartnerId === orderedIds[targetIndex]
          ) {
            targetIndex++;
          }
          targetIndex++;
        }
        const currentCousinIds = cousins
          .filter(
            (cousin) =>
              !placedCousins.has(cousin.id) &&
              this.parentIds(cousin.id).includes(parentLayerId),
          )
          .map((cousin) => cousin.id);
        orderedIds.splice(targetIndex, 0, ...currentCousinIds);
        currentCousinIds.forEach((id) => placedCousins.add(id));
      }
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
              this.placeParentsOverChildren(
                node,
                partner,
                sharedChildIds,
                nextX,
              );
              partner.yPos = y;
              placed.add(nodeId);
              placed.add(partnerId);
              nextX =
                Math.max(node.xPos!, partner.xPos!) + this.spacing.siblings;
            } else {
              // couple has no children
              node.xPos = nextX;
              partner.xPos = nextX + this.spacing.partners;
              partner.yPos = y;
              placed.add(nodeId);
              placed.add(partnerId);
              nextX = partner.xPos + this.spacing.siblings;
            }
          }
        } else {
          // solo or ex partner
          const nodeChildIds = this.childrenOf(nodeId);
          if (nodeChildIds.length > 0) {
            // has children
            const exPartnerId = this.exPartnerId(nodeId);
            if (exPartnerId) {
              const partner = this.nodeById(exPartnerId);
              if (partner) {
                const sharedChildIds = nodeChildIds.filter((childId) =>
                  this.childrenOf(exPartnerId).includes(childId),
                );
                this.placeParentsOverChildren(
                  node,
                  partner,
                  sharedChildIds,
                  nextX,
                );
                partner.yPos = y;
                placed.add(nodeId);
                placed.add(exPartnerId);
                nextX =
                  Math.max(node.xPos!, partner.xPos!) + this.spacing.siblings;
              }
            }
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

  placeParentsOverChildren(
    partner1: FamilyTreeMember,
    partner2: FamilyTreeMember,
    sharedChildIds: string[],
    nextX: number,
  ) {
    if (partner2.xPos == null) {
      const childXs = Array.from(sharedChildIds)
        .map((childId) => this.nodeById(childId)?.xPos)
        .filter((x): x is number => x != null);
      const centerX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
      partner1.xPos = centerX - this.spacing.partners / 2;
      partner2.xPos = centerX + this.spacing.partners / 2;
      if (nextX > 0) {
        partner1.xPos = Math.max(nextX, partner1.xPos);
        partner2.xPos = Math.max(nextX + this.spacing.partners, partner2.xPos);
      }
    } else if (partner1.xPos == null) {
      // partner 2 has already been placed
      if (
        (partner1.exPartnerId === partner2.id &&
          partner2.gender === 'female') ||
        (partner1.partnerId === partner2.id && partner2.gender === 'male')
      ) {
        // insert partner1 left of partner 2 and shift nodes right
        this.insertNodeAt(partner1, partner2.xPos - this.spacing.partners);
      } else {
        // insert partner1 right of partner 2 and shift nodes right
        partner1.xPos = partner2.xPos + this.spacing.partners;
        this.insertNodeAt(partner1, partner2.xPos + this.spacing.partners);
      }
    }
  }

  // try to insert a node at the specified x position with the given space after it,
  // shifting nodes to its right as necessary
  insertNodeAt(node: FamilyTreeMember, desiredX: number) {
    const layer = this.nodeLayer(node.id)!;
    const layerNodes = this.layerGroups.get(layer)!;
    const previousNodeIds = layerNodes.filter((nodeId) => {
      if (nodeId == node.id) return false;
      const xPos = this.nodeById(nodeId)!.xPos;
      return xPos != null && xPos <= desiredX;
    });
    const previousNodeId = previousNodeIds[previousNodeIds.length - 1];
    if (previousNodeId) {
      // prvious node, so position at an appropriate distance
      const previousNode = this.nodeById(previousNodeId)!;
      let space = this.spacing.siblings;
      if (
        previousNode.partnerId === node.id ||
        previousNode.exPartnerId === node.id
      ) {
        space = this.spacing.partners;
      }
      node.xPos = Math.max(desiredX, previousNode.xPos! + space);
    } else {
      // no previous nodes, so position at desired location
      node.xPos = desiredX;
    }
    const followingNodeIds = layerNodes.filter((nodeId) => {
      if (nodeId == node.id) return false;
      const xPos = this.nodeById(nodeId)!.xPos;
      return xPos != null && xPos >= node.xPos!;
    });
    const offset = node.xPos - desiredX;
    if (offset > 0) {
      followingNodeIds.forEach((nodeId) => {
        const node = this.nodeById(nodeId);
        if (node) node.xPos = node.xPos! += offset;
      });
    }
  }

  // Find farthest left node and move it to 0, updating other nodes.
  adjustXCoordinates() {
    const leftmostX = this.nodes
      .map((node) => node.xPos!)
      .reduce((previous, current) => {
        return Math.min(previous, current);
      }, 0);
    if (leftmostX === 0) return;

    this.nodes.forEach((node) => {
      node.xPos! -= leftmostX;
    });
  }
}

export default FamilyTreeLayout;
