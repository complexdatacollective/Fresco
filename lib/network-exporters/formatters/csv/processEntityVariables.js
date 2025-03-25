// Determine which variables to include

import { includes } from 'es-toolkit/compat';
import {
  getAttributePropertyFromCodebook,
  getEntityAttributes,
} from '../../utils/general';

/**
 *
 * @param {*} entityObject
 * @param {*} entity
 * @param {*} codebook
 * @param {*} exportOptions
 * @returns
 */
const processEntityVariables = (
  entityObject,
  entity, // Node, Edge, Ego
  codebook,
  exportOptions,
) => ({
  ...entityObject,
  attributes: Object.keys(getEntityAttributes(entityObject)).reduce(
    (accumulatedAttributes, attributeUUID) => {
      const attributeName = getAttributePropertyFromCodebook({
        codebook,
        entityType: entity,
        entityName: entityObject.type,
        variableId: attributeUUID,
        attributeProperty: 'name',
      });

      const attributeType = getAttributePropertyFromCodebook({
        codebook,
        entityType: entity,
        entityName: entityObject.type,
        variableId: attributeUUID,
        attributeProperty: 'type',
      });

      const attributeData = getEntityAttributes(entityObject)[attributeUUID];

      if (attributeType === 'categorical') {
        const attributeOptions =
          getAttributePropertyFromCodebook({
            codebook,
            entityType: entity,
            entityName: entityObject.type,
            variableId: attributeUUID,
            attributeProperty: 'options',
          }) || [];
        const optionData = attributeOptions.reduce(
          (accumulatedOptions, optionName) => ({
            ...accumulatedOptions,
            [`${attributeName}_${optionName.value}`]:
              !!attributeData && includes(attributeData, optionName.value),
          }),
          {},
        );
        return { ...accumulatedAttributes, ...optionData };
      }

      if (attributeType === 'layout') {
        // Process screenLayoutCoordinates option
        const xCoord = attributeData && attributeData.x;
        const yCoord = attributeData && attributeData.y;

        const {
          screenLayoutWidth,
          screenLayoutHeight,
          useScreenLayoutCoordinates,
        } = exportOptions.globalOptions;

        const screenSpaceAttributes =
          attributeData && useScreenLayoutCoordinates
            ? {
                [`${attributeName}_screenSpaceX`]: (
                  attributeData.x * screenLayoutWidth
                ).toFixed(2),
                [`${attributeName}_screenSpaceY`]: (
                  (1.0 - attributeData.y) *
                  screenLayoutHeight
                ).toFixed(2),
              }
            : {};

        const layoutAttrs = {
          [`${attributeName}_x`]: xCoord,
          [`${attributeName}_y`]: yCoord,
          ...screenSpaceAttributes,
        };

        return { ...accumulatedAttributes, ...layoutAttrs };
      }

      if (attributeName) {
        return { ...accumulatedAttributes, [attributeName]: attributeData };
      }

      return { ...accumulatedAttributes, [attributeUUID]: attributeData };
    },
    {},
  ),
});

export default processEntityVariables;
