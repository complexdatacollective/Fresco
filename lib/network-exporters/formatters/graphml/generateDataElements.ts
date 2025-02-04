import {
  type Codebook,
  edgeExportIDProperty,
  edgeSourceProperty,
  edgeTargetProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEgo,
  ncSourceUUID,
  ncTargetUUID,
  ncTypeProperty,
  ncUUIDProperty,
  nodeExportIDProperty,
} from '@codaco/shared-consts';
import { type Document, type Element } from '@xmldom/xmldom';
import { findKey, includes } from 'es-toolkit/compat';
import { type NcEntity } from '~/schemas/network-canvas';
import {
  getAttributePropertyFromCodebook,
  getEntityAttributes,
} from '../../utils/general';
import {
  type EdgeWithResequencedID,
  type ExportOptions,
  type NodeWithResequencedID,
} from '../../utils/types';
import { createDataElement, sha1 } from './helpers';

/**
 * Function for processing attributes of an entity
 */
function processAttributes(
  entityAttributes: Record<string, unknown>,
  codebook: Codebook,
  type: 'node' | 'edge',
  entityName: string | null,
  document: Document,
  domElement: Element,
  exportOptions: ExportOptions,
) {
  Object.entries(entityAttributes).forEach(([key, value]) => {
    // Don't process empty values.
    if (value === null) {
      return;
    }

    const codebookAttributeName =
      getAttributePropertyFromCodebook(
        codebook,
        type,
        {
          entity: type,
          type: entityName,
        },
        key,
        'name',
      ) ?? sha1(key);

    const codebookAttributeType = getAttributePropertyFromCodebook(
      codebook,
      type,
      {
        entity: type,
        type: entityName,
      },
      key,
      'type',
    );

    switch (codebookAttributeType) {
      case 'categorical':
        {
          const options = getAttributePropertyFromCodebook(
            codebook,
            type,
            {
              entity: type,
              type: entityName,
            },
            key,
            'options',
          ) as { value: string }[];

          options.forEach((option) => {
            const hashedOptionValue = sha1(option.value);
            const optionKey = `${key}_${hashedOptionValue}`;
            domElement.appendChild(
              createDataElement(
                document,
                { key: optionKey },
                !!entityAttributes[key] &&
                  includes(entityAttributes[key], option.value),
              ),
            );
          });
        }

        break;
      case 'layout': {
        // Determine if we should use the normalized or the "screen space" value
        const xCoord = entityAttributes[key].x;
        const yCoord = entityAttributes[key].y;

        domElement.appendChild(
          createDataElement(document, { key: `${key}_X` }, xCoord),
        );
        domElement.appendChild(
          createDataElement(document, { key: `${key}_Y` }, yCoord),
        );

        const { screenLayoutWidth, screenLayoutHeight } =
          exportOptions.globalOptions;

        if (exportOptions.globalOptions.useScreenLayoutCoordinates) {
          const screenSpaceXCoord = (xCoord * screenLayoutWidth).toFixed(2);
          const screenSpaceYCoord = (
            (1.0 - yCoord) *
            screenLayoutHeight
          ).toFixed(2);
          domElement.appendChild(
            createDataElement(
              document,
              { key: `${key}_screenSpaceX` },
              screenSpaceXCoord,
            ),
          );
          domElement.appendChild(
            createDataElement(
              document,
              { key: `${key}_screenSpaceY` },
              screenSpaceYCoord,
            ),
          );
        }

        break;
      }
      default: {
        // If we reach this point, we could not detect the attribute type by looking
        // in the codebook.
        // We therefore use the SHA1 hash of the name as the key
        domElement.appendChild(
          createDataElement(
            document,
            { key: codebookAttributeName },
            entityAttributes[key],
          ),
        );
      }
    }

    // Handle categorical variables
    if (codebookAttributeType === 'categorical') {
      // Handle all codebook variables apart from layout variables
    } else if (typeof entityAttributes[key] !== 'object') {
      domElement.appendChild(
        createDataElement(document, { key }, entityAttributes[key]),
      );
      // Handle layout variables
    } else if (codebookAttributeType === 'layout') {
      // Handle non-codebook variables
    } else {
      domElement.appendChild(
        createDataElement(document, { key: keyName }, entityAttributes[key]),
      );
    }
  });
}

/**
 * Function that returns a function that generates <data> elements for a given entity
 */
export default function getDataElementGenerator(
  document: Document, // These could be replaced by class properties if this were moved into a class...
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  return <
    T extends NodeWithResequencedID[] | EdgeWithResequencedID[] | NcEntity,
  >(
    entities: T,
  ) => {
    // // If the entity is an object (not an array) it is an ego
    if (!Array.isArray(entities)) {
      console.log('getDataElementGenerator was passed ego');
      return generateEgoDataElements(
        document,
        entities,
        [],
        codebook,
        exportOptions,
      );
    }

    const fragment = document.createDocumentFragment();

    // Iterate entities
    entities.forEach((entity) => {
      const type = Object.prototype.hasOwnProperty.call(
        entity,
        edgeSourceProperty,
      )
        ? 'edge'
        : 'node';
      const entityAttributes = getEntityAttributes(entity);
      // Create an element representing the entity (<node> or <edge>)
      const domElement = document.createElement(type);

      // Set the id of the entity element to the export ID property
      domElement.setAttribute(
        'id',
        type === 'node'
          ? (entity as NodeWithResequencedID)[nodeExportIDProperty].toString()
          : (entity as EdgeWithResequencedID)[edgeExportIDProperty].toString(),
      );

      // Create data element for entity UUID
      domElement.appendChild(
        createDataElement(
          document,
          { key: ncUUIDProperty },
          entity[entityPrimaryKeyProperty],
        ),
      );

      // Create data element for entity type
      const entityTypeName = codebook[type]?.[entity.type]?.name ?? entity.type;
      domElement.appendChild(
        createDataElement(document, { key: ncTypeProperty }, entityTypeName),
      );

      /**
       *
       * Special handling for model variables and variables unique to entity type
       *
       */

      if (type === 'edge') {
        // Add source and target properties and map them to the _from and _to attributes
        domElement.setAttribute(
          'source',
          (entity as EdgeWithResequencedID)[edgeSourceProperty].toString(),
        );
        domElement.setAttribute(
          'target',
          (entity as EdgeWithResequencedID)[edgeTargetProperty].toString(),
        );

        // Insert the nc UUID versions of 'to' and 'from' under special properties
        domElement.appendChild(
          createDataElement(
            document,
            { key: ncSourceUUID },
            (entity as EdgeWithResequencedID)[ncSourceUUID],
          ),
        );

        domElement.appendChild(
          createDataElement(
            document,
            { key: ncTargetUUID },
            (entity as EdgeWithResequencedID)[ncTargetUUID],
          ),
        );
      } else {
        // For nodes, add a <data> element for the label using the name property
        const entityLabel = () => {
          const variableCalledName = findKey(
            codebook[type]?.[entity.type]?.variables ?? {},
            (variable) => variable.name.toLowerCase() === 'name',
          );

          if (
            variableCalledName &&
            entity[entityAttributesProperty][variableCalledName]
          ) {
            return entity[entityAttributesProperty][variableCalledName];
          }

          return 'Node';
        };

        domElement.appendChild(
          createDataElement(document, { key: 'label' }, entityLabel()),
        );
      }

      const attributes = processAttributes(
        entityAttributes,
        codebook,
        type,
        entity.type,
        document,
        domElement,
        exportOptions,
      );

      fragment.appendChild(domElement);
    });

    return fragment;
  };
}

/**
 * Function for creating data elements for ego
 * Ego data elements are attached directly to the <graph> element
 *
 * @param {*} document - the XML ownerDocument
 * @param {Object} ego - an object representing ego
 * @param {Array} excludeList - Attributes to exclude lookup of in codebook
 * @param {Object} codebook - Copy of codebook
 * @param {Object} exportOptions - Export options object
 */
const generateEgoDataElements = (
  document: Document,
  ego: NcEgo,
  excludeList: string[],
  codebook: Codebook,
  exportOptions: ExportOptions,
) => {
  const fragment = document.createDocumentFragment();

  // Get the ego's attributes for looping over later
  const entityAttributes = getEntityAttributes(ego);

  // Create data element for Ego UUID
  fragment.appendChild(
    createDataElement(
      document,
      { key: ncUUIDProperty },
      ego[entityPrimaryKeyProperty],
    ),
  );

  // Add entity attributes
  Object.keys(entityAttributes).forEach((key) => {
    const keyName =
      getAttributePropertyFromCodebook(codebook, 'ego', null, key, 'name') ??
      sha1(key);

    const keyType = getAttributePropertyFromCodebook(
      codebook,
      'ego',
      null,
      key,
      'type',
    );

    if (
      typeof keyName === 'string' &&
      !excludeList.includes(keyName) &&
      entityAttributes[key] !== null
    ) {
      if (keyType === 'categorical') {
        const options = getAttributePropertyFromCodebook(
          codebook,
          'ego',
          null,
          key,
          'options',
        ) as { value: string }[];

        options.forEach((option) => {
          const hashedOptionValue = sha1(option.value);
          const optionKey = `${key}_${hashedOptionValue}`;
          fragment.appendChild(
            createDataElement(
              document,
              { key: optionKey },
              !!entityAttributes[key] &&
                includes(entityAttributes[key], option.value),
            ),
          );
        });
      } else if (keyType && typeof entityAttributes[key] !== 'object') {
        fragment.appendChild(
          createDataElement(document, { key }, entityAttributes[key]),
        );
      } else if (keyType === 'layout') {
        // TODO: can ego have a layout?
        // Determine if we should use the normalized or the "screen space" value
        const xCoord = entityAttributes[key]?.x as number;
        const yCoord = entityAttributes[key]?.y as number;

        fragment.appendChild(
          createDataElement(document, { key: `${key}_X` }, xCoord.toString()),
        );
        fragment.appendChild(
          createDataElement(document, { key: `${key}_Y` }, yCoord.toString()),
        );

        const { screenLayoutWidth, screenLayoutHeight } =
          exportOptions.globalOptions;

        if (exportOptions.globalOptions.useScreenLayoutCoordinates) {
          const screenSpaceXCoord = (xCoord * screenLayoutWidth).toFixed(2);
          const screenSpaceYCoord = (
            (1.0 - yCoord) *
            screenLayoutHeight
          ).toFixed(2);
          fragment.appendChild(
            createDataElement(
              document,
              { key: `${key}_screenSpaceX` },
              screenSpaceXCoord,
            ),
          );
          fragment.appendChild(
            createDataElement(
              document,
              { key: `${key}_screenSpaceY` },
              screenSpaceYCoord,
            ),
          );
        }
      } else {
        fragment.appendChild(
          createDataElement(document, { key: keyName }, entityAttributes[key]),
        );
      }
    }
  });

  return fragment;
};
