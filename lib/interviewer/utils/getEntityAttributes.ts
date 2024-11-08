import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';

export default function (node: NcNode) {
  return node[entityAttributesProperty] || {};
}
