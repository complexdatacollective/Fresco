import { type NcNode, type NcEdge } from '@codaco/shared-consts';

/**
 * Edge types for family relationships
 */
export enum FamilyRelationshipType {
  PARENT_CHILD = 'parent_child',
  PARTNERSHIP = 'partnership',
  EX_PARTNERSHIP = 'ex_partnership',
}

/**
 * Extended NcNode for family tree members
 * Layout data is stored in attributes with _ prefix to indicate it's private to layout
 */
export type FamilyTreeNode = NcNode & {
  attributes: NcNode['attributes'] & {
    // User data
    gender?: string;
    name?: string;
    isEgo?: boolean;

    // Layout data (private to layout algorithm)
    _layoutX?: number;
    _layoutY?: number;
    _layoutLayer?: number;
    _layoutProcessed?: boolean;
  };
};

/**
 * Family relationship edge using NcEdge
 */
export type FamilyTreeEdge = NcEdge & {
  type: FamilyRelationshipType;
  attributes: NcEdge['attributes'] & {
    // Relationship metadata
    _layoutProcessed?: boolean;
    childOrder?: number; // For ordering siblings
  };
};

/**
 * Network structure for family tree
 */
export type FamilyTreeNetwork = {
  nodes: Map<string, FamilyTreeNode>;
  edges: Map<string, FamilyTreeEdge>;

  // Indexed lookups for performance
  nodeEdges: Map<string, Set<string>>; // nodeId -> edgeIds
  edgesByType: Map<FamilyRelationshipType, Set<string>>; // edgeType -> edgeIds
  childToParentEdges: Map<string, string[]>; // childId -> parent edge ids
  partnerEdges: Map<string, string>; // nodeId -> current partner edge id
  exPartnerEdges: Map<string, Set<string>>; // nodeId -> ex-partner edge ids
};

/**
 * Configuration for tree layout spacing
 */
export type TreeSpacing = {
  siblings: number;
  partners: number;
  generations: number;
};

/**
 * Legacy FamilyTreeMember type for backward compatibility
 */
export type FamilyTreeMember = {
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
