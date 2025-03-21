import { type EntityDefinition } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type NcEntity,
} from '@codaco/shared-consts';

/**
 * This function generates default values for all variables in the variable registry for this node
 * type.
 *
 * @param {object} variablesForType - An object containing the variable registry entry for this
 *                                   node type.
 */
export const getDefaultAttributesForEntityType = (
  variablesForType: EntityDefinition['variables'] = {},
) => {
  const defaultAttributesObject = {} as NcEntity[EntityAttributesProperty];

  // ALL variables initialised as `null`
  Object.keys(variablesForType).forEach((variableUUID) => {
    defaultAttributesObject[variableUUID] = null;
  });

  return defaultAttributesObject;
};
