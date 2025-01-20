import { type EntityAttributesProperty, type EntityTypeDefinition, type NcEntity } from "~/lib/shared-consts";

/**
 * This function generates default values for all variables in the variable registry for this node
 * type.
 *
 * @param {object} variablesForType - An object containing the variable registry entry for this
 *                                   node type.
 */
export const getDefaultAttributesForEntityType = (
  variablesForType: EntityTypeDefinition['variables'] = {},
) => {
  const defaultAttributesObject = {} as NcEntity[EntityAttributesProperty];

  // ALL variables initialised as `null`
  Object.keys(variablesForType).forEach((variableUUID) => {
    defaultAttributesObject[variableUUID] = null;
  });

  return defaultAttributesObject;
};
