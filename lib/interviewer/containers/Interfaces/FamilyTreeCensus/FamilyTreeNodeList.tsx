import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  NcNode,
} from '@codaco/shared-consts';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { PlaceholderNodeProps } from './FamilyTreeNode';

const getStringNodeAttribute = (node: NcNode, attribute: string): string => {
  let value = getEntityAttributes(node)[attribute];
  value = typeof value == 'string' ? value : 'unknown';

  return value;
};

const getNumberNodeAttribute = (node: NcNode, attribute: string): number => {
  let value = getEntityAttributes(node)[attribute];
  value = typeof value == 'number' ? value : 0;

  return value;
};

class FamilyTreeNodeList {
  placeholderNodes: PlaceholderNodeProps[];
  networkNodes: NcNode[];

  constructor(
    placeholderNodes: PlaceholderNodeProps[],
    networkNodes: NcNode[],
  ) {
    this.placeholderNodes = placeholderNodes;
    this.networkNodes = networkNodes;
  }

  allNodes() {
    const placeholderNodeFromNetworkNode = (
      node: NcNode,
    ): PlaceholderNodeProps => {
      let parents = node[entityAttributesProperty]['parents'];
      parents = typeof parents == 'object' ? parents : 0;
      return {
        id: node[entityPrimaryKeyProperty],
        gender: getStringNodeAttribute(node, 'gender'),
        label: getStringNodeAttribute(node, 'name'),
        xPos: getNumberNodeAttribute(node, 'x'),
        yPos: getNumberNodeAttribute(node, 'y'),
      };
    };
    const networkNodeIds = this.networkNodes.map(
      (node) => node[entityPrimaryKeyProperty],
    );
    return this.placeholderNodes
      .filter((node) => !networkNodeIds.includes(node.id ?? ''))
      .concat(
        this.networkNodes.map((node) => placeholderNodeFromNetworkNode(node)),
      );
  }

  childrenOf(parentNode: PlaceholderNodeProps) {
    return this.allNodes().filter((node) =>
      (parentNode.childrenIds ?? []).includes(node.id ?? ''),
    );
  }
}

export default FamilyTreeNodeList;
