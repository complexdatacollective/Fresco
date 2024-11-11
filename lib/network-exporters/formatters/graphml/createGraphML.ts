import {
  type Codebook,
  type NcEgo,
  type NcEntity,
  type NcNetwork,
  VariableType,
  caseProperty,
  codebookHashProperty,
  edgeExportIDProperty,
  edgeSourceProperty,
  edgeTargetProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
  ncTypeProperty,
  ncUUIDProperty,
  nodeExportIDProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
import { createHash } from 'crypto';
import { findKey, includes } from 'lodash';
import {
  getAttributePropertyFromCodebook,
  getEntityAttributes,
} from '~/lib/network-exporters/utils/general';
import { type ExportOptions } from '../../utils/types';
import { type ExportFileNetwork } from '../session/exportFile';
import { createDataElement, getGraphMLTypeForKey } from './helpers';

// Utility sha1 function that returns hashed text
const sha1 = (text: string) => {
  return createHash('sha1').update(text, 'utf8').digest('hex');
};

const setUpXml = (sessionVariables: ExportFileNetwork['sessionVariables']) => {
  const doc = new DOMImplementation().createDocument(null, 'graphml', null);

  // Set the necessary namespaces and attributes
  const root = doc.documentElement!;
  root.setAttribute('xmlns', 'http://graphml.graphdrawing.org/xmlns');
  root.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
  root.setAttribute(
    'xsi:schemaLocation',
    'http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd',
  );
  root.setAttribute('xmlns:nc', 'http://schema.networkcanvas.com/xmlns');

  const pi = doc.createProcessingInstruction(
    'xml',
    'version="1.0" encoding="UTF-8"',
  );
  doc.insertBefore(pi, doc.firstChild);

  // Create the graph element
  const graph = doc.createElement('graph');

  // Add attributes
  graph.setAttribute('edgedefault', 'undirected');
  graph.setAttribute('nc:caseId', sessionVariables[caseProperty]);
  graph.setAttribute('nc:sessionUUID', sessionVariables[sessionProperty]);
  graph.setAttribute('nc:protocolName', sessionVariables[protocolName]);
  graph.setAttribute('nc:protocolUID', sessionVariables[protocolProperty]);
  graph.setAttribute('nc:codebookHash', sessionVariables[codebookHashProperty]);
  graph.setAttribute(
    'nc:sessionExportTime',
    sessionVariables[sessionExportTimeProperty],
  );

  if (sessionVariables[sessionStartTimeProperty]) {
    graph.setAttribute(
      'nc:sessionStartTime',
      sessionVariables[sessionStartTimeProperty],
    );
  }

  if (sessionVariables[sessionFinishTimeProperty]) {
    graph.setAttribute(
      'nc:sessionFinishTime',
      sessionVariables[sessionFinishTimeProperty],
    );
  }

  root.appendChild(graph);

  return doc;
};

// <key> elements provide the type definitions for GraphML data elements
const generateKeyElements = (
  document: XMLDocument,
  entities: NcNetwork['nodes'] | NcNetwork['edges'],
  type: 'node' | 'edge' | 'ego',
  excludeList: string[],
  codebook: Codebook,
  exportOptions: ExportOptions,
) => {
  const fragment = document.createDocumentFragment();

  // track variables we have already created <key>s for
  const done = new Set();

  if (
    type === 'node' &&
    done.has('type') === false &&
    !excludeList.includes('type')
  ) {
    const typeDataElement = document.createElement('key');
    typeDataElement.setAttribute('id', ncTypeProperty);
    typeDataElement.setAttribute('attr.name', ncTypeProperty);
    typeDataElement.setAttribute('attr.type', 'string');
    typeDataElement.setAttribute('for', 'all');
    fragment.appendChild(typeDataElement);
    done.add('type');
  }

  // Create a <key> for network canvas UUID.
  if (
    type === 'node' &&
    done.has('uuid') === false &&
    !excludeList.includes('uuid')
  ) {
    const typeDataElement = document.createElement('key');
    typeDataElement.setAttribute('id', ncUUIDProperty);
    typeDataElement.setAttribute('attr.name', ncUUIDProperty);
    typeDataElement.setAttribute('attr.type', 'string');
    typeDataElement.setAttribute('for', 'all');
    fragment.appendChild(typeDataElement);
    done.add('uuid');
  }

  // Create a <key> for `from` and `to` properties that reference network canvas UUIDs.
  if (type === 'edge' && done.has('originalEdgeSource') === false) {
    // Create <key> for type
    const targetDataElement = document.createElement('key');
    targetDataElement.setAttribute('id', ncTargetUUID);
    targetDataElement.setAttribute('attr.name', ncTargetUUID);
    targetDataElement.setAttribute('attr.type', 'string');
    targetDataElement.setAttribute('for', 'edge');
    fragment.appendChild(targetDataElement);

    const sourceDataElement = document.createElement('key');
    sourceDataElement.setAttribute('id', ncSourceUUID);
    sourceDataElement.setAttribute('attr.name', ncSourceUUID);
    sourceDataElement.setAttribute('attr.type', 'string');
    sourceDataElement.setAttribute('for', 'edge');
    fragment.appendChild(sourceDataElement);

    done.add('originalEdgeSource');
  }

  // Main loop over entities
  entities.forEach((entity: NcEntity) => {
    const elementAttributes = getEntityAttributes(entity);

    // nodes and edges have for="node|edge" but ego has for="graph"
    const keyTarget = type === 'ego' ? 'graph' : type;

    // Loop over attributes for this entity
    Object.keys(elementAttributes).forEach((key) => {
      // transpose ids to names based on codebook; fall back to the raw key
      const keyName =
        (getAttributePropertyFromCodebook(
          codebook,
          type,
          entity,
          key,
          'name',
        ) as string) ?? key;

      // Test if we have already created a key for this variable, and that it
      // isn't on our exclude list.
      if (done.has(key) === false && !excludeList.includes(keyName)) {
        const keyElement = document.createElement('key');

        // Determine attribute type to decide how to encode it
        const variableType = getAttributePropertyFromCodebook(
          codebook,
          type,
          entity,
          key,
        );

        // <key> id must be xs:NMTOKEN: http://books.xmlschemata.org/relaxng/ch19-77231.html
        // do not be tempted to change this to the variable 'name' for this reason!
        if (variableType) {
          keyElement.setAttribute('id', key);
        } else {
          // If variableType is undefined, variable wasn't in the codebook (could be external data).
          // This means that key might not be a UUID, so update the key ID to be SHA1 of variable
          // name to ensure it is xs:NMTOKEN compliant
          const hashedKeyName = sha1(key);
          keyElement.setAttribute('id', hashedKeyName);
        }

        // Use human readable variable name for the attr.name attribute
        keyElement.setAttribute('attr.name', keyName);

        switch (variableType) {
          case VariableType.boolean:
            keyElement.setAttribute('attr.type', variableType);
            break;
          case VariableType.ordinal:
          case VariableType.number: {
            const keyType = getGraphMLTypeForKey(entities, key) as
              | 'int'
              | 'double'
              | 'string'
              | 'number';
            keyElement.setAttribute('attr.type', keyType || 'string');
            break;
          }
          case VariableType.layout: {
            // special handling for layout variables: split the variable into
            // two <key> elements - one for X and one for Y.
            keyElement.setAttribute('attr.name', `${keyName}_Y`);
            keyElement.setAttribute('id', `${key}_Y`);
            keyElement.setAttribute('attr.type', 'double');

            // Create a second element to model the <key> for
            // the X value
            const keyElement2 = document.createElement('key');
            keyElement2.setAttribute('id', `${key}_X`);
            keyElement2.setAttribute('attr.name', `${keyName}_X`);
            keyElement2.setAttribute('attr.type', 'double');
            keyElement2.setAttribute('for', keyTarget);
            fragment.appendChild(keyElement2);

            if (exportOptions.globalOptions.useScreenLayoutCoordinates) {
              // Create a third element to model the <key> for
              // the screen space Y value
              const keyElement3 = document.createElement('key');
              keyElement3.setAttribute('id', `${key}_screenSpaceY`);
              keyElement3.setAttribute('attr.name', `${keyName}_screenSpaceY`);
              keyElement3.setAttribute('attr.type', 'double');
              keyElement3.setAttribute('for', keyTarget);
              fragment.appendChild(keyElement3);

              // Create a fourth element to model the <key> for
              // the screen space X value
              const keyElement4 = document.createElement('key');
              keyElement4.setAttribute('id', `${key}_screenSpaceX`);
              keyElement4.setAttribute('attr.name', `${keyName}_screenSpaceX`);
              keyElement4.setAttribute('attr.type', 'double');
              keyElement4.setAttribute('for', keyTarget);
              fragment.appendChild(keyElement4);
            }

            break;
          }
          case VariableType.categorical: {
            /*
             * Special handling for categorical variables:
             * Because categorical variables can have multiple membership, we
             * split them out into several boolean variables
             *
             * Because key id must be an xs:NMTOKEN, we hash the option value.
             */

            // fetch options property for this variable
            const options = getAttributePropertyFromCodebook(
              codebook,
              type,
              entity,
              key,
              'options',
            ) as { value: string }[];

            options.forEach((option, index) => {
              // Hash the value to ensure that it is NKTOKEN compliant
              const hashedOptionValue = sha1(option.value);

              if (index === options.length - 1) {
                keyElement.setAttribute('id', `${key}_${hashedOptionValue}`);
                keyElement.setAttribute(
                  'attr.name',
                  `${keyName}_${option.value}`,
                );
                keyElement.setAttribute('attr.type', 'boolean');
              } else {
                const keyElement2 = document.createElement('key');
                keyElement2.setAttribute('id', `${key}_${hashedOptionValue}`);
                keyElement2.setAttribute(
                  'attr.name',
                  `${keyName}_${option.value}`,
                );
                keyElement2.setAttribute('attr.type', 'boolean');
                keyElement2.setAttribute('for', keyTarget);
                fragment.appendChild(keyElement2);
              }
            });
            break;
          }
          case VariableType.scalar:
            keyElement.setAttribute('attr.type', 'float');
            break;
          case VariableType.text:
          case VariableType.datetime:
          default:
            keyElement.setAttribute('attr.type', 'string');
        }

        keyElement.setAttribute('for', keyTarget);
        fragment.appendChild(keyElement);
        done.add(key);
      }
    });
  });
  return fragment;
};

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
  document: XMLDocument,
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

    if (!excludeList.includes(keyName) && entityAttributes[key] !== null) {
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
        const xCoord = entityAttributes[key].x;
        const yCoord = entityAttributes[key].y;

        fragment.appendChild(
          createDataElement(document, { key: `${key}_X` }, xCoord),
        );
        fragment.appendChild(
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

// @return {DocumentFragment} a fragment containing all XML elements for the supplied dataList
const generateDataElements = (
  document: XMLDocument, // the XML ownerDocument
  entities: NcNetwork['nodes'] | NcNetwork['edges'], // the list of entities to generate data elements for
  type: 'node' | 'edge', // 'node' or 'edge'
  excludeList: string[], // Variables to exclude
  codebook: Codebook, // codebook
  exportOptions: ExportOptions,
) => {
  const fragment = document.createDocumentFragment();

  // Iterate entities
  entities.forEach((entity) => {
    // Create an element representing the entity (<node> or <edge>)
    const domElement = document.createElement(type);

    // Get the entity's attributes for looping over later
    const entityAttributes = getEntityAttributes(entity);

    // Set the id of the entity element to the export ID property
    domElement.setAttribute(
      'id',
      type === 'node'
        ? entity[nodeExportIDProperty]
        : entity[edgeExportIDProperty],
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

    // Special handling for model variables and variables unique to entity type
    if (type === 'edge') {
      // Add source and target properties and map
      // them to the _from and _to attributes
      domElement.setAttribute('source', entity[edgeSourceProperty]);
      domElement.setAttribute('target', entity[edgeTargetProperty]);

      // Insert the nc UUID versions of 'to' and 'from' under special properties
      domElement.appendChild(
        createDataElement(
          document,
          { key: ncSourceUUID },
          entity[ncSourceUUID],
        ),
      );

      domElement.appendChild(
        createDataElement(
          document,
          { key: ncTargetUUID },
          entity[ncTargetUUID],
        ),
      );
    } else {
      // For nodes, add a <data> element for the label using the name property
      const entityLabel = () => {
        const variableCalledName = findKey(
          codebook[type]?.[entity.type]?.variables,
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

    // Add entity attributes
    Object.keys(entityAttributes).forEach((key) => {
      let keyName = getAttributePropertyFromCodebook(
        codebook,
        type,
        entity,
        key,
        'name',
      ) as string;
      const keyType = getAttributePropertyFromCodebook(
        codebook,
        type,
        entity,
        key,
        'type',
      );

      // Generate sha1 of keyName if it wasn't found in the codebook
      if (!keyName) {
        keyName = sha1(key);
      }

      if (!excludeList.includes(keyName) && entityAttributes[key] !== null) {
        // Handle categorical variables
        if (keyType === 'categorical') {
          const options = getAttributePropertyFromCodebook(
            codebook,
            type,
            entity,
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
          // Handle all codebook variables apart from layout variables
        } else if (keyType && typeof entityAttributes[key] !== 'object') {
          domElement.appendChild(
            createDataElement(document, { key }, entityAttributes[key]),
          );
          // Handle layout variables
        } else if (keyType === 'layout') {
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

          // Handle non-codebook variables
        } else {
          // If we reach this point, we could not detect the attribute type by looking
          // in the codebook.
          // We therefore use the SHA1 hash of the name as the key
          domElement.appendChild(
            createDataElement(
              document,
              { key: keyName },
              entityAttributes[key],
            ),
          );
        }
      }
    });

    fragment.appendChild(domElement);
  });

  return fragment;
};

/**
 * Generator function to supply XML content in chunks to both string and stream producers
 * @param {*} network
 * @param {*} codebook
 * @param {*} exportOptions
 */
function* graphMLGenerator(
  network: ExportFileNetwork,
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  const xmlDoc = setUpXml(network.sessionVariables);

  // get the graphML element, which is where keys are appended
  const graphMLElement = xmlDoc.getElementsByTagName('graphml')[0]!;

  // Create <key> for a 'label' variable for display in Gephi.

  const labelDataElement = xmlDoc.createElement('key');
  labelDataElement.setAttribute('id', 'label');
  labelDataElement.setAttribute('attr.name', 'label');
  labelDataElement.setAttribute('attr.type', 'string');
  labelDataElement.setAttribute('for', 'all');

  graphMLElement.appendChild(labelDataElement);

  // generate keys for ego
  graphMLElement.appendChild(
    generateKeyElements(
      xmlDoc,
      [network.ego],
      'ego',
      [],
      codebook,
      exportOptions,
    ),
  );

  // generate keys for nodes
  graphMLElement.appendChild(
    generateKeyElements(
      xmlDoc,
      network.nodes,
      'node',
      [],
      codebook,
      exportOptions,
    ),
  );

  // generate keys for edges
  graphMLElement.appendChild(
    generateKeyElements(
      xmlDoc,
      network.edges,
      'edge',
      [],
      codebook,
      exportOptions,
    ),
  );

  // get the graph element, since this is what we will mostly be appending to
  const graphElement = xmlDoc.getElementsByTagName('graph')[0]!;

  // Add ego to graph
  if (network.ego && codebook.ego) {
    graphElement.appendChild(
      generateEgoDataElements(xmlDoc, network.ego, [], codebook, exportOptions),
    );
  }

  // add nodes and edges to graph
  if (network.nodes) {
    graphElement.appendChild(
      generateDataElements(
        xmlDoc,
        network.nodes,
        'node',
        [],
        codebook,
        exportOptions,
      ),
    );
  }

  if (network.edges) {
    graphElement.appendChild(
      generateDataElements(
        xmlDoc,
        network.edges,
        'edge',
        [],
        codebook,
        exportOptions,
      ),
    );
  }

  // Serialize the XML document
  const serializer = new XMLSerializer();
  yield serializer.serializeToString(xmlDoc);
}

export default graphMLGenerator;
