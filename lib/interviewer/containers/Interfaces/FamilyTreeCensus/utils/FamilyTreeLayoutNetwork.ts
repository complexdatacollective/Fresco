import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import {
  type FamilyTreeEdge,
  type FamilyTreeNetwork,
  type FamilyTreeNode,
  type TreeSpacing,
  FamilyRelationshipType,
} from './FamilyTreeNetworkTypes';

/**
 * Network-based family tree layout algorithm
 */
export class FamilyTreeLayoutNetwork {
  private network: FamilyTreeNetwork;
  private spacing: TreeSpacing;

  constructor(
    nodes: NcNode[],
    edges: NcEdge[],
    spacing: TreeSpacing = {
      siblings: 100,
      partners: 80,
      generations: 100,
    },
  ) {
    this.spacing = spacing;
    this.network = this.buildNetwork(nodes, edges);
    this.performLayout();
  }

  /**
   * Build the network structure with indexed lookups
   */
  private buildNetwork(nodes: NcNode[], edges: NcEdge[]): FamilyTreeNetwork {
    const network: FamilyTreeNetwork = {
      nodes: new Map(),
      edges: new Map(),
      nodeEdges: new Map(),
      edgesByType: new Map(),
      childToParentEdges: new Map(),
      partnerEdges: new Map(),
      exPartnerEdges: new Map(),
    };

    // Initialize edge type maps
    Object.values(FamilyRelationshipType).forEach((type) => {
      network.edgesByType.set(type, new Set());
    });

    // Add nodes
    nodes.forEach((node) => {
      const familyNode = node as FamilyTreeNode;
      network.nodes.set(node._uid, familyNode);
      network.nodeEdges.set(node._uid, new Set());
    });

    // Add edges and build indexes
    edges.forEach((edge) => {
      const familyEdge = edge as FamilyTreeEdge;
      network.edges.set(edge._uid, familyEdge);

      // Add to node edges index
      network.nodeEdges.get(edge.from)?.add(edge._uid);
      network.nodeEdges.get(edge.to)?.add(edge._uid);

      // Add to type index
      network.edgesByType.get(familyEdge.type)?.add(edge._uid);

      // Build specialized indexes
      if (familyEdge.type === FamilyRelationshipType.PARENT_CHILD) {
        if (!network.childToParentEdges.has(edge.to)) {
          network.childToParentEdges.set(edge.to, []);
        }
        network.childToParentEdges.get(edge.to)?.push(edge._uid);
      } else if (familyEdge.type === FamilyRelationshipType.PARTNERSHIP) {
        network.partnerEdges.set(edge.from, edge._uid);
        network.partnerEdges.set(edge.to, edge._uid);
      } else if (familyEdge.type === FamilyRelationshipType.EX_PARTNERSHIP) {
        if (!network.exPartnerEdges.has(edge.from)) {
          network.exPartnerEdges.set(edge.from, new Set());
        }
        if (!network.exPartnerEdges.has(edge.to)) {
          network.exPartnerEdges.set(edge.to, new Set());
        }
        network.exPartnerEdges.get(edge.from)?.add(edge._uid);
        network.exPartnerEdges.get(edge.to)?.add(edge._uid);
      }
    });

    return network;
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): FamilyTreeNode | undefined {
    return this.network.nodes.get(nodeId);
  }

  /**
   * Get all edges connected to a node
   */
  getEdges(nodeId: string, type?: FamilyRelationshipType): FamilyTreeEdge[] {
    const edgeIds = this.network.nodeEdges.get(nodeId) ?? new Set();
    let edges = Array.from(edgeIds)
      .map((id) => this.network.edges.get(id))
      .filter((edge): edge is FamilyTreeEdge => edge !== undefined);

    if (type) {
      edges = edges.filter((edge) => edge.type === type);
    }

    return edges;
  }

  /**
   * Get parent nodes of a child
   */
  getParents(nodeId: string): FamilyTreeNode[] {
    const parentEdgeIds = this.network.childToParentEdges.get(nodeId) ?? [];
    return parentEdgeIds
      .map((edgeId) => {
        const edge = this.network.edges.get(edgeId);
        return edge ? this.network.nodes.get(edge.from) : undefined;
      })
      .filter((node): node is FamilyTreeNode => node !== undefined);
  }

  /**
   * Get children nodes of a parent
   */
  getChildren(nodeId: string): FamilyTreeNode[] {
    const childEdges = this.getEdges(
      nodeId,
      FamilyRelationshipType.PARENT_CHILD,
    ).filter((edge) => edge.from === nodeId);

    return childEdges
      .map((edge) => this.network.nodes.get(edge.to))
      .filter((node): node is FamilyTreeNode => node !== undefined);
  }

  /**
   * Get current partner of a node
   */
  getPartner(nodeId: string): FamilyTreeNode | undefined {
    const partnerEdgeId = this.network.partnerEdges.get(nodeId);
    if (!partnerEdgeId) return undefined;

    const edge = this.network.edges.get(partnerEdgeId);
    if (!edge) return undefined;

    const partnerId = edge.from === nodeId ? edge.to : edge.from;
    return this.network.nodes.get(partnerId);
  }

  /**
   * Get ex-partners of a node
   */
  getExPartners(nodeId: string): FamilyTreeNode[] {
    const exEdgeIds = this.network.exPartnerEdges.get(nodeId) ?? new Set();
    return Array.from(exEdgeIds)
      .map((edgeId) => {
        const edge = this.network.edges.get(edgeId);
        if (!edge) return undefined;
        const exId = edge.from === nodeId ? edge.to : edge.from;
        return this.network.nodes.get(exId);
      })
      .filter((node): node is FamilyTreeNode => node !== undefined);
  }

  /**
   * Get siblings of a node (children of same parents)
   */
  getSiblings(nodeId: string): FamilyTreeNode[] {
    const parents = this.getParents(nodeId);
    if (parents.length === 0) return [];

    const siblingSet = new Set<string>();
    parents.forEach((parent) => {
      this.getChildren(parent._uid).forEach((child) => {
        if (child._uid !== nodeId) {
          siblingSet.add(child._uid);
        }
      });
    });

    // Filter to only include full siblings (same parents)
    const nodeParentIds = new Set(parents.map((p) => p._uid));
    return Array.from(siblingSet)
      .map((id) => this.network.nodes.get(id))
      .filter((sibling): sibling is FamilyTreeNode => {
        if (!sibling) return false;
        const siblingParentIds = new Set(
          this.getParents(sibling._uid).map((p) => p._uid),
        );
        // Check if they have the same parents
        return (
          nodeParentIds.size === siblingParentIds.size &&
          Array.from(nodeParentIds).every((id) => siblingParentIds.has(id))
        );
      });
  }

  /**
   * Get half-siblings of a node (share exactly one parent)
   */
  getHalfSiblings(nodeId: string): FamilyTreeNode[] {
    const parents = this.getParents(nodeId);
    if (parents.length === 0) return [];

    const halfSiblingSet = new Set<string>();
    const nodeParentIds = new Set(parents.map((p) => p._uid));

    parents.forEach((parent) => {
      this.getChildren(parent._uid).forEach((child) => {
        if (child._uid !== nodeId) {
          const childParentIds = new Set(
            this.getParents(child._uid).map((p) => p._uid),
          );
          // Count shared parents
          const sharedParents = Array.from(nodeParentIds).filter((id) =>
            childParentIds.has(id),
          );
          if (sharedParents.length === 1) {
            halfSiblingSet.add(child._uid);
          }
        }
      });
    });

    return Array.from(halfSiblingSet)
      .map((id) => this.network.nodes.get(id))
      .filter((node): node is FamilyTreeNode => node !== undefined);
  }

  /**
   * Find the ego node
   */
  getEgo(): FamilyTreeNode | undefined {
    for (const node of this.network.nodes.values()) {
      if (node.attributes.isEgo) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Get layout position for a node
   */
  getLayoutPosition(nodeId: string): { x: number; y: number } | undefined {
    const node = this.getNode(nodeId);
    if (!node) return undefined;

    const x = node.attributes._layoutX;
    const y = node.attributes._layoutY;

    if (typeof x === 'number' && typeof y === 'number') {
      return { x, y };
    }
    return undefined;
  }

  /**
   * Perform the layout algorithm
   */
  private performLayout(): void {
    this.resetLayoutData();
    this.assignLayers();
    this.assignCoordinates();
    this.adjustCoordinates();
  }

  /**
   * Reset layout data in all nodes
   */
  private resetLayoutData(): void {
    this.network.nodes.forEach((node) => {
      node.attributes._layoutX = undefined;
      node.attributes._layoutY = undefined;
      node.attributes._layoutLayer = undefined;
      node.attributes._layoutProcessed = false;
    });
  }

  /**
   * Assign generation layers to nodes
   */
  private assignLayers(): void {
    const processed = new Set<string>();
    const queue: Array<{ nodeId: string; layer: number }> = [];

    // Find root nodes (no parents)
    this.network.nodes.forEach((node) => {
      const parents = this.getParents(node._uid);
      if (parents.length === 0) {
        queue.push({ nodeId: node._uid, layer: 0 });
        node.attributes._layoutLayer = 0;
        processed.add(node._uid);
      }
    });

    // Process queue to assign layers
    while (queue.length > 0) {
      const { nodeId, layer } = queue.shift()!;
      const children = this.getChildren(nodeId);

      children.forEach((child) => {
        const childLayer = layer + 1;
        const currentLayer = child.attributes._layoutLayer;

        if (typeof currentLayer !== 'number' || childLayer > currentLayer) {
          child.attributes._layoutLayer = childLayer;
          if (!processed.has(child._uid)) {
            queue.push({ nodeId: child._uid, layer: childLayer });
            processed.add(child._uid);
          }
        }
      });
    }

    // Ensure partners are on the same layer
    this.network.partnerEdges.forEach((_, nodeId) => {
      const node = this.getNode(nodeId);
      const partner = this.getPartner(nodeId);

      if (node && partner) {
        const nodeLayer = node.attributes._layoutLayer ?? 0;
        const partnerLayer = partner.attributes._layoutLayer ?? 0;
        const targetLayer = Math.max(nodeLayer, partnerLayer);

        node.attributes._layoutLayer = targetLayer;
        partner.attributes._layoutLayer = targetLayer;
      }
    });
  }

  /**
   * Assign x,y coordinates to nodes
   */
  private assignCoordinates(): void {
    // Group nodes by layer
    const layerGroups = new Map<number, FamilyTreeNode[]>();

    this.network.nodes.forEach((node) => {
      const layer = node.attributes._layoutLayer ?? 0;
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, []);
      }
      layerGroups.get(layer)?.push(node);
    });

    // Sort layers
    const layers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

    // Position nodes layer by layer
    layers.forEach((layer) => {
      const nodes = layerGroups.get(layer) ?? [];
      let x = 0;

      nodes.forEach((node) => {
        // Position based on children if they exist
        const children = this.getChildren(node._uid);
        if (children.length > 0) {
          const childXPositions = children
            .map((child) => child.attributes._layoutX)
            .filter((x): x is number => typeof x === 'number');

          if (childXPositions.length > 0) {
            // Center over children
            const avgChildX =
              childXPositions.reduce((a, b) => a + b, 0) /
              childXPositions.length;
            node.attributes._layoutX = avgChildX;
          } else {
            node.attributes._layoutX = x;
            x += this.spacing.siblings;
          }
        } else {
          node.attributes._layoutX = x;
          x += this.spacing.siblings;
        }

        // Set Y position based on layer
        node.attributes._layoutY = layer * this.spacing.generations;

        // Position partner next to node
        const partner = this.getPartner(node._uid);
        if (partner && typeof partner.attributes._layoutX !== 'number') {
          partner.attributes._layoutX =
            (node.attributes._layoutX ?? 0) + this.spacing.partners;
          partner.attributes._layoutY = node.attributes._layoutY;
        }
      });
    });
  }

  /**
   * Adjust coordinates to start from 0,0
   */
  private adjustCoordinates(): void {
    let minX = Infinity;
    let minY = Infinity;

    this.network.nodes.forEach((node) => {
      const x = node.attributes._layoutX;
      const y = node.attributes._layoutY;

      if (typeof x === 'number') minX = Math.min(minX, x);
      if (typeof y === 'number') minY = Math.min(minY, y);
    });

    if (minX !== Infinity && minY !== Infinity) {
      this.network.nodes.forEach((node) => {
        if (typeof node.attributes._layoutX === 'number') {
          node.attributes._layoutX -= minX;
        }
        if (typeof node.attributes._layoutY === 'number') {
          node.attributes._layoutY -= minY;
        }
      });
    }
  }

  /**
   * Export layout results as a simple object for rendering
   */
  exportLayout(): Array<{ id: string; x: number; y: number }> {
    const result: Array<{ id: string; x: number; y: number }> = [];

    this.network.nodes.forEach((node) => {
      const x = node.attributes._layoutX;
      const y = node.attributes._layoutY;

      if (typeof x === 'number' && typeof y === 'number') {
        result.push({ id: node._uid, x, y });
      }
    });

    return result;
  }
}
