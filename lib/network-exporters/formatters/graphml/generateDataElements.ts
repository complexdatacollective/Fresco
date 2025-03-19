import type { Codebook } from '@codaco/protocol-validation';
import {
  edgeExportIDProperty,
  edgeSourceProperty,
  edgeTargetProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
  ncSourceUUID,
  ncTargetUUID,
  ncTypeProperty,
  ncUUIDProperty,
  nodeExportIDProperty,
} from '@codaco/shared-consts';
import { type DocumentFragment, DOMImplementation } from '@xmldom/xmldom';
import { findKey } from 'es-toolkit/compat';
import {
  type EdgeWithResequencedID,
  type ExportOptions,
  type NodeWithResequencedID,
} from '../../utils/types';
import {
  createDataElement,
  createDocumentFragment,
  deriveEntityType,
} from './helpers';
import processAttributes from './processAttributes';

/**
 * Function that returns a function that generates <data> elements for a given entity
 */
export default function getDataElementGenerator(
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  return (
    entities: NodeWithResequencedID[] | EdgeWithResequencedID[] | NcEgo,
  ): DocumentFragment => {
    const dom = new DOMImplementation().createDocument(null, 'root', null);
    const fragment = createDocumentFragment();

    const entityType = deriveEntityType(entities);

    // If the entity is an object (not an array) it is an ego
    if (!Array.isArray(entities)) {
      const entityDataElements = generateDataElementsForEntity(
        entities,
        codebook,
        exportOptions,
      );
      fragment.appendChild(entityDataElements);
    } else {
      // Iterate entities
      entities.forEach((entity) => {
        const entityDataElements = generateDataElementsForEntity(
          entity,
          entityType,
          codebook,
          exportOptions,
        );
        fragment.appendChild(entityDataElements);
      });
    }

    return fragment;
  };
}

function generateDataElementsForEntity(
  entity: NodeWithResequencedID | EdgeWithResequencedID | NcEgo,
  codebook: Codebook,
  exportOptions: ExportOptions,
): DocumentFragment {
  const fragment = createDocumentFragment();
  const dom = new DOMImplementation().createDocument(null, 'root', null);
  const entityType = deriveEntityType(entity);

  if (entityType === 'ego') {
    const keyDataElement = createDataElement(
      {
        key: ncUUIDProperty,
      },
      entity[entityPrimaryKeyProperty],
    );

    fragment.appendChild(keyDataElement);

    const dataElements = processAttributes(entity, codebook, exportOptions);

    fragment.appendChild(dataElements);

    return fragment;
  }

  // Create an element representing the entity (<node> or <edge>)
  const domElement = dom.createElement(entityType);

  // Set the id of the entity element to the export ID property
  domElement.setAttribute(
    'id',
    entityType === 'node'
      ? (entity as NodeWithResequencedID)[nodeExportIDProperty].toString()
      : (entity as EdgeWithResequencedID)[edgeExportIDProperty].toString(),
  );

  // Create data element for entity UUID
  domElement.appendChild(
    createDataElement(
      { key: ncUUIDProperty },
      entity[entityPrimaryKeyProperty],
    ),
  );

  // Create data element for entity type
  const type = (entity as NcNode | NcEdge).type;
  const entityTypeName = codebook[entityType]?.[type]?.name ?? type;
  domElement.appendChild(
    createDataElement({ key: ncTypeProperty }, entityTypeName),
  );

  /**
   * Special handling for model variables and variables unique to entity type
   */
  if (entityType === 'edge') {
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
        { key: ncSourceUUID },
        (entity as EdgeWithResequencedID)[ncSourceUUID],
      ),
    );

    domElement.appendChild(
      createDataElement(
        { key: ncTargetUUID },
        (entity as EdgeWithResequencedID)[ncTargetUUID],
      ),
    );
  } else {
    // For nodes, add a <data> element for the label using the name property
    const entityLabel = () => {
      const variableCalledName = findKey(
        codebook[entityType]?.[type]?.variables ?? {},
        (variable) => variable.name.toLowerCase() === 'name',
      );

      if (
        variableCalledName &&
        entity[entityAttributesProperty][variableCalledName]
      ) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(entity[entityAttributesProperty][variableCalledName]);
      }

      return 'Node';
    };

    domElement.appendChild(createDataElement({ key: 'label' }, entityLabel()));
  }

  const dataElements = processAttributes(entity, codebook, exportOptions);
  domElement.appendChild(dataElements);
  fragment.appendChild(domElement);

  return fragment;
}
