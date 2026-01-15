import { type NodeDefinition } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';

// To be a valid label candidate, an attribute value must not be empty/null/undefined,
// and must be castable as a string or number.
const isValidLabelCandidate = (
  value: unknown,
  variableDefinition?: NonNullable<NodeDefinition['variables']>[string],
) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const type = typeof value;

  // If there's no variable definition, just check the type of value
  if (!variableDefinition) {
    if (type === 'string' || type === 'number') {
      return true;
    }
  } else {
    if (
      variableDefinition.type === 'text' ||
      variableDefinition.type === 'number' ||
      variableDefinition.type === 'datetime' ||
      variableDefinition.type === 'location'
    ) {
      // If there is a variable definition allow additional types if the variable is encrypted
      if (variableDefinition.encrypted) {
        // Only allow text, number, datetime, and location, since they can be cast to string
        return true;
      }

      // If not encrypted, check for a valid value that can be cas to a string
      return type === 'string' || type === 'number';
    }
  }

  return false;
};

/**
 * Finds the name variable from codebook using heuristics:
 * 1. Variable with name property === "name" (case insensitive)
 * 2. Variable with name property containing "name"
 * 3. First text variable
 *
 * This is the codebook-only portion of the node labeling logic.
 * See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
 */
export const getNameVariableFromCodebook = (
  codebookVariables: NodeDefinition['variables'],
): string | null => {
  if (!codebookVariables) return null;

  // 1. Look for variable with name property === "name"
  const variableCalledName = Object.entries(codebookVariables).find(
    ([, variable]) => variable.name.toLowerCase() === 'name',
  );

  if (variableCalledName) {
    return variableCalledName[0];
  }

  // 2. Look for variable with name containing "name"
  const nameRegex = /name/i;
  const variableContainingName = Object.entries(codebookVariables).find(
    ([, variable]) => nameRegex.test(variable.name),
  );

  if (variableContainingName) {
    return variableContainingName[0];
  }

  // 3. Fall back to first text variable
  const firstTextVariable = Object.entries(codebookVariables).find(
    ([, variable]) => variable.type === 'text',
  );

  if (firstTextVariable) {
    return firstTextVariable[0];
  }

  return null;
};

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export const getNodeLabelAttribute = (
  codebookVariables: NodeDefinition['variables'],
  nodeAttributes: NcNode[EntityAttributesProperty],
): string | null => {
  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName = Object.entries(codebookVariables ?? {}).find(
    ([, variable]) => variable.name.toLowerCase() === 'name',
  );

  if (
    variableCalledName &&
    isValidLabelCandidate(
      nodeAttributes[variableCalledName[0]],
      variableCalledName[1],
    )
  ) {
    return variableCalledName[0];
  }

  // 2. Look for a variable in the codebook with a name property that contains
  // "name" (case insensitive), and try to retrieve this value by key in the node's
  // attributes,
  const test = new RegExp('name', 'i');
  const match = Object.keys(codebookVariables ?? {}).find(
    (attribute) =>
      test.test(attribute) &&
      isValidLabelCandidate(
        nodeAttributes[attribute],
        codebookVariables?.[attribute],
      ),
  );

  if (match) {
    return match;
  }

  // 3. As above but for node attribute keys.
  // Since node attribute keys are UIDs when generated in Architect, the only circumstance
  // where this would return a valid label is for external data. Therefore we don't need
  // to pass the codebook.
  const nodeVariableCalledName = Object.keys(nodeAttributes).find(
    (attribute) =>
      test.test(attribute) && isValidLabelCandidate(nodeAttributes[attribute]),
  );

  if (nodeVariableCalledName) {
    return nodeVariableCalledName;
  }

  // 4. Collect all the codebook variables of type text, and iterate over them on the
  // node, returning the first one that has a value assigned.
  const textVariables = Object.entries(codebookVariables ?? {}).filter(
    ([_, variable]) => variable.type === 'text',
  );

  for (const [variableKey] of textVariables) {
    if (
      isValidLabelCandidate(
        nodeAttributes[variableKey],
        codebookVariables?.[variableKey],
      )
    ) {
      return variableKey;
    }
  }

  // 5. Last resort is to return null. Consumers should handle this.
  return null;
};
