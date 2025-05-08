import { type NodeDefinition } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { findKey } from 'es-toolkit';

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const getNodeLabelAttribute = (
  codebookVariables: NodeDefinition['variables'],
  nodeAttributes: NcNode[EntityAttributesProperty],
): string | null => {
  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName = findKey(
    codebookVariables ?? {},
    (variable) => variable.name.toLowerCase() === 'name',
  );

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    return variableCalledName;
  }

  // 2. Look for a property in nodeAttributes with a key of ‘name’, and return the value
  const nodeVariableCalledName = Object.keys(nodeAttributes).find(
    (attribute) => attribute.toLowerCase() === 'name',
  );

  if (nodeVariableCalledName) {
    return nodeVariableCalledName;
  }

  // 3. As above, but using codebook labels and fuzzy matching
  const test = new RegExp('name', 'i');
  const match = Object.keys(codebookVariables ?? {}).find(
    (attribute) => test.test(attribute) && nodeAttributes[attribute],
  );

  if (match) {
    return match;
  }

  // 3. Collect all the codebook variables of type text, and iterate over them on the
  // node, returning the first one that has a value assigned.
  const textVariables = Object.entries(codebookVariables ?? {}).filter(
    ([_, variable]) => variable.type === 'text',
  );

  for (const [variableKey] of textVariables) {
    if (nodeAttributes[variableKey]) {
      return variableKey;
    }
  }

  // 3. Last resort is to return undefined. Consumers should handle this.
  return null;
};
