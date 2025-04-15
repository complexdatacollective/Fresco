import {
  VariableTypes,
  type Codebook,
  type StageSubject,
} from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { get, includes, toNumber } from 'es-toolkit/compat';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';

// TODO: move to protocol validation
type VariableType = (typeof VariableTypes)[keyof typeof VariableTypes];

/**
 * Try to determine the type of an attribute based on data across all nodes
 * in a nodeList. This is a best effort approach, and may not be accurate.
 *
 * We default to text if we can't determine the type, or if the type is
 * inconsistent across nodes.
 * @param attributeKey
 * @param nodeList
 * @returns
 */
const deriveAttributeTypeFromData = (
  attributeKey: string,
  nodeList: NcNode[],
) =>
  nodeList.reduce((previousType, node) => {
    const currentValue: FieldValue = get(
      node,
      `[${entityAttributesProperty}][${attributeKey}]`,
    );

    // if the value is null or undefined, defer to the previous type
    if (!currentValue || previousType === VariableTypes.text) {
      return previousType;
    }

    let currentType = '';

    // If the value can be parsed as a number, set the type to number
    if (!Number.isNaN(toNumber(currentValue))) {
      currentType = VariableTypes.number;
    }

    // If the value can be parsed as a boolean, set the type to boolean
    if (
      String(currentValue).toLowerCase() === 'true' ||
      String(currentValue).toLowerCase() === 'false'
    ) {
      currentType = VariableTypes.boolean;
    }

    // could insert regex for array/object detection, but not helpful if not in the codebook

    // fallback to text if a conflict emerges, or first instance of non-null data
    if (
      (previousType !== '' && currentType !== previousType) ||
      (currentType === '' && !!currentValue)
    ) {
      return VariableTypes.text;
    }
    return currentType as VariableType;
  }, '');

const getAttributeTypes = (
  uniqueAttributeKeys: string[],
  nodeList: NcNode[],
  protocolCodebook: Codebook,
  stageSubject: StageSubject,
) =>
  uniqueAttributeKeys.reduce((derivedTypes, attributeKey) => {
    const codebookDefinition = getCodebookDefinition(
      protocolCodebook,
      stageSubject,
    );

    let codebookType = get(
      codebookDefinition,
      `variables[${attributeKey}].type`,
    ) as VariableType | undefined;

    if (includes(VariableTypes, codebookType)) {
      return { ...derivedTypes, [attributeKey]: codebookType };
    }

    // possible categorical or layout variable
    if (attributeKey.includes('_')) {
      const uuid = attributeKey.substring(0, attributeKey.indexOf('_'));
      const option = attributeKey.substring(attributeKey.indexOf('_'));
      codebookType = get(codebookDefinition, `variables[${uuid}].type`);
      if (includes(VariableTypes, codebookType)) {
        if (option === '_x' || option === '_y') {
          return {
            ...derivedTypes,
            [attributeKey]: `${codebookType}${option}`,
          };
        }
        return { ...derivedTypes, [attributeKey]: `${codebookType}_option` };
      }
    }

    // use type based on column data because the codebook type wasn't valid
    codebookType = deriveAttributeTypeFromData(
      attributeKey,
      nodeList,
    ) as VariableType;
    return { ...derivedTypes, [attributeKey]: codebookType };
  }, {});

const getCodebookDefinition = (
  protocolCodebook: Codebook,
  stageSubject: StageSubject,
) => {
  const entityType = stageSubject.entity;
  if (entityType === 'ego') {
    return protocolCodebook[entityType] ?? {};
  }

  const stageNodeType = stageSubject.type;
  return protocolCodebook[entityType]?.[stageNodeType] ?? {};
};

// compile list of attributes from a nodelist that aren't already in the codebook
const getUniqueAttributeKeys = (
  nodeList: NcNode[],
  protocolCodebook: Codebook,
  stageSubject: StageSubject,
) =>
  nodeList.reduce((attributeKeys: string[], node) => {
    const codebookDefinition = getCodebookDefinition(
      protocolCodebook,
      stageSubject,
    );
    const variables = Object.keys(node.attributes);
    const nonCodebookVariables = variables.filter(
      (attributeKey) => !get(codebookDefinition, `variables[${attributeKey}]`),
    );
    const novelVariables = nonCodebookVariables.filter(
      (attributeKey) => !attributeKeys.includes(attributeKey),
    );
    return [...attributeKeys, ...novelVariables];
  }, []);

const getNodeListUsingTypes = (
  nodeList: NcNode[],
  protocolCodebook: Codebook,
  stageSubject: StageSubject,
  derivedAttributeTypes: Record<string, string>,
) =>
  nodeList.map((node) => {
    const codebookDefinition = getCodebookDefinition(
      protocolCodebook,
      stageSubject,
    );
    const attributes = Object.entries(node.attributes).reduce(
      (consolidatedAttributes, [attributeKey, attributeValue]) => {
        if (
          attributeValue === null ||
          attributeValue === undefined ||
          attributeValue === ''
        ) {
          return consolidatedAttributes;
        }

        let codebookType: string | undefined =
          codebookDefinition?.variables?.[attributeKey]?.type;

        if (!Object.values(VariableTypes).includes(codebookType!)) {
          codebookType = derivedAttributeTypes[attributeKey];
        }

        switch (codebookType) {
          case VariableTypes.boolean: {
            return {
              ...consolidatedAttributes,
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              [attributeKey]: String(attributeValue).toLowerCase() === 'true',
            };
          }
          case VariableTypes.number:
          case VariableTypes.scalar: {
            return {
              ...consolidatedAttributes,
              [attributeKey]: Number(attributeValue),
            };
          }
          case VariableTypes.categorical:
          case VariableTypes.ordinal:
          case VariableTypes.layout: {
            try {
              const value = JSON.parse(attributeValue as string) as {
                x: number;
                y: number;
              };

              return {
                ...consolidatedAttributes,
                [attributeKey]: value,
              };
            } catch (e) {
              return {
                ...consolidatedAttributes,
                [attributeKey]: attributeValue,
              };
            }
          }
          // Handle column names with _x and _y suffixes, indicating this is a file we created
          case `${VariableTypes.layout}_x`: {
            const uuid = attributeKey.substring(0, attributeKey.indexOf('_'));
            return {
              ...consolidatedAttributes,
              [uuid]: {
                ...(consolidatedAttributes[uuid] as { x: number; y: number }),
                x: Number(attributeValue),
              },
            };
          }
          case `${VariableTypes.layout}_y`: {
            const uuid = attributeKey.substring(0, attributeKey.indexOf('_'));
            return {
              ...consolidatedAttributes,
              [uuid]: {
                ...(consolidatedAttributes[uuid] as { x: number; y: number }),
                y: Number(attributeValue),
              },
            };
          }
          // Handle column names with _option suffixes, indicating this is a file we created
          case `${VariableTypes.categorical}_option`: {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            if (String(attributeValue).toLowerCase() === 'true') {
              const uuid = attributeKey.substring(0, attributeKey.indexOf('_'));
              const option = attributeKey.substring(
                attributeKey.indexOf('_') + 1,
              );
              const previousOptions =
                (consolidatedAttributes[uuid] as string[]) || [];
              try {
                return {
                  ...consolidatedAttributes,
                  [uuid]: [...previousOptions, JSON.parse(option)],
                };
              } catch (e) {
                return {
                  ...consolidatedAttributes,
                  [uuid]: [...previousOptions, option],
                };
              }
            }
            return consolidatedAttributes;
          }
          case VariableTypes.datetime:
          case VariableTypes.text:
          default:
            return {
              ...consolidatedAttributes,
              [attributeKey]: attributeValue,
            };
        }
      },
      {} as Record<string, unknown>,
    );

    return {
      ...node,
      [entityAttributesProperty]: attributes,
    };
  });

// Cast types for data based on codebook and data, according to stage subject.
export const withTypeReplacement = (
  nodeList: NcNode[],
  protocolCodebook: Codebook,
  stageSubject: StageSubject,
) => {
  const uniqueAttributeKeys = getUniqueAttributeKeys(
    nodeList,
    protocolCodebook,
    stageSubject,
  );

  const codebookAttributeTypes = getAttributeTypes(
    uniqueAttributeKeys,
    nodeList,
    protocolCodebook,
    stageSubject,
  );

  // make substitutes using codebook first, then column data derivation
  return getNodeListUsingTypes(
    nodeList,
    protocolCodebook,
    stageSubject,
    codebookAttributeTypes,
  );
};

export const getVariableTypeReplacements = (
  sourceFile: string,
  uuidData: NcNode[],
  protocolCodebook: Codebook,
  stageSubject: StageSubject,
) => {
  const fileExtension = (fileName: string) => fileName.split('.').pop();
  const fileType = fileExtension(sourceFile) === 'csv' ? 'csv' : 'json';
  if (fileType === 'csv') {
    return withTypeReplacement(uuidData, protocolCodebook, stageSubject);
  }
  return uuidData;
};
