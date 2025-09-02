// Determine which variables to include

import {
  type Codebook,
  type EntityDefinition,
} from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { includes } from 'es-toolkit/compat';
import { getEntityAttributes } from '../../utils/general';
import { type ExportOptions } from '../../utils/types';

// TODO: move to protocol validation
export type VariableDefinition = NonNullable<
  EntityDefinition['variables']
>[string];

/**
 *
 * @param {*} entityObject
 * @param {*} entity
 * @param {*} codebook
 * @param {*} exportOptions
 * @returns
 */
const processEntityVariables = (
  entityObject: NcEdge | NcNode | NcEgo,
  entity: 'ego' | 'node' | 'edge',
  codebook: Codebook,
  exportOptions: ExportOptions,
) => ({
  ...entityObject,
  attributes: Object.keys(getEntityAttributes(entityObject)).reduce(
    (accumulatedAttributes, attributeUUID) => {
      let codebookAttribute: VariableDefinition | undefined;

      if (entity === 'ego') {
        codebookAttribute = codebook.ego?.variables?.[attributeUUID];
      } else {
        codebookAttribute =
          codebook[entity]?.[(entityObject as NcNode | NcEdge).type]
            ?.variables?.[attributeUUID];
      }

      const attributeName = codebookAttribute?.name;
      const attributeType = codebookAttribute?.type;
      const attributeIsEncrypted = codebookAttribute?.encrypted;
      const attributeData =
        entityObject[entityAttributesProperty][attributeUUID];

      if (attributeType === 'categorical') {
        const attributeOptions = codebookAttribute?.options ?? [];

        if (attributeIsEncrypted) {
          // If the variable is encrypted, we don't want to export it.
          return {
            ...accumulatedAttributes,
            ...attributeOptions.reduce((accumulatedOptions, optionName) => {
              return {
                ...accumulatedOptions,
                [`${attributeName}_${optionName.value}`]: 'ENCRYPTED',
              };
            }, {}),
          };
        }

        const optionData = attributeOptions.reduce(
          (accumulatedOptions, optionName) => ({
            ...accumulatedOptions,
            [`${attributeName}_${optionName.value}`]:
              !!attributeData &&
              includes(attributeData as unknown[], optionName.value),
          }),
          {},
        );
        return { ...accumulatedAttributes, ...optionData };
      }

      if (attributeType === 'layout') {
        if (attributeIsEncrypted) {
          return {
            ...accumulatedAttributes,
            [`${attributeName}_x`]: 'ENCRYPTED',
            [`${attributeName}_y`]: 'ENCRYPTED',
          };
        }

        // Process screenLayoutCoordinates option
        const xCoord = (
          attributeData as
            | {
                x: number;
                y: number;
              }
            | undefined
        )?.x;
        const yCoord = (
          attributeData as
            | {
                x: number;
                y: number;
              }
            | undefined
        )?.y;

        const {
          screenLayoutWidth,
          screenLayoutHeight,
          useScreenLayoutCoordinates,
        } = exportOptions.globalOptions;

        const screenSpaceAttributes =
          attributeData && useScreenLayoutCoordinates
            ? {
                [`${attributeName}_screenSpaceX`]: (
                  xCoord! * screenLayoutWidth
                ).toFixed(2),
                [`${attributeName}_screenSpaceY`]: (
                  (1.0 - yCoord!) *
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
        if (attributeIsEncrypted) {
          return {
            ...accumulatedAttributes,
            [attributeName]: 'ENCRYPTED',
          };
        }
        return { ...accumulatedAttributes, [attributeName]: attributeData };
      }

      return { ...accumulatedAttributes, [attributeUUID]: attributeData };
    },
    {},
  ),
});

export default processEntityVariables;
