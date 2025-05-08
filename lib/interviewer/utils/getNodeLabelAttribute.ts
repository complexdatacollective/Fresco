import { type NodeDefinition } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { findKey } from 'es-toolkit';

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const labelLogic = (
  codebookForNodeType: NodeDefinition,
  nodeAttributes: NcNode[EntityAttributesProperty],
): string => {
  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName =
    codebookForNodeType?.variables &&
    // Ignore case when looking for 'name'
    findKey(
      codebookForNodeType.variables,
      (variable) => variable.name.toLowerCase() === 'name',
    );

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    return nodeAttributes[variableCalledName] as string;
  }

  // 2. Look for a property in nodeAttributes with a key of ‘name’, and return the value
  const nodeVariableCalledName = Object.entries(nodeAttributes).find(
    ([key]) => key.toLowerCase() === 'name',
  )?.[1];

  if (nodeVariableCalledName) {
    // cast to string
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(nodeVariableCalledName);
  }

  // 3. Collect all the codebook variables of type text, and iterate over them on the
  // node, returning the first one that has a value assigned.
  const textVariables = Object.entries(
    codebookForNodeType?.variables ?? {},
  ).filter(([_, variable]) => variable.type === 'text');

  for (const [variableKey] of textVariables) {
    if (nodeAttributes[variableKey]) {
      return nodeAttributes[variableKey] as string;
    }
  }

  // 3. Last resort!
  return `${codebookForNodeType.name}`;
};
