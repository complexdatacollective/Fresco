import { type Codebook } from '@codaco/protocol-validation';
import {
  ncSourceUUID,
  ncTargetUUID,
  ncTypeProperty,
  ncUUIDProperty,
  type NcEgo,
} from '@codaco/shared-consts';
import { DOMImplementation, type DocumentFragment } from '@xmldom/xmldom';
import { get } from 'es-toolkit/compat';
import { getEntityAttributes } from '../../utils/general';
import {
  type EdgeWithResequencedID,
  type ExportOptions,
  type NodeWithResequencedID,
} from '../../utils/types';
import {
  createDocumentFragment,
  deriveEntityType,
  getCodebookVariablesForEntity,
  getGraphMLTypeForKey,
  sha1,
} from './helpers';

// <key> elements provide the type definitions for GraphML data elements
export default function getKeyElementGenerator(
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  return (
    incomingEntities: NodeWithResequencedID[] | EdgeWithResequencedID[] | NcEgo,
  ): DocumentFragment => {
    // Important to create the fragment on each invocation
    const fragment = createDocumentFragment();
    const dom = new DOMImplementation().createDocument(null, 'root', null);

    // track variables we have already created <key>s for, so we don't duplicate
    const done = new Set<string>();

    const entityType = deriveEntityType(incomingEntities);

    let entities;
    if (entityType === 'ego') {
      entities = [incomingEntities as NcEgo];
    } else {
      entities = incomingEntities;
    }

    if (entityType === 'node' && !done.has('type')) {
      const typeDataElement = dom.createElement('key');
      typeDataElement.setAttribute('id', ncTypeProperty);
      typeDataElement.setAttribute('attr.name', ncTypeProperty);
      typeDataElement.setAttribute('attr.type', 'string');
      typeDataElement.setAttribute('for', 'all');
      fragment.appendChild(typeDataElement);
      done.add('type');
    }

    // Create a <key> for network canvas UUID.
    if (entityType === 'node' && !done.has('uuid')) {
      const typeDataElement = dom.createElement('key');
      typeDataElement.setAttribute('id', ncUUIDProperty);
      typeDataElement.setAttribute('attr.name', ncUUIDProperty);
      typeDataElement.setAttribute('attr.type', 'string');
      typeDataElement.setAttribute('for', 'all');
      fragment.appendChild(typeDataElement);
      done.add('uuid');
    }

    // Create a <key> for `from` and `to` properties that reference network canvas UUIDs.
    if (entityType === 'edge' && !done.has('originalEdgeSource')) {
      // Create <key> for type
      const targetDataElement = dom.createElement('key');
      targetDataElement.setAttribute('id', ncTargetUUID);
      targetDataElement.setAttribute('attr.name', ncTargetUUID);
      targetDataElement.setAttribute('attr.type', 'string');
      targetDataElement.setAttribute('for', 'edge');
      fragment.appendChild(targetDataElement);

      const sourceDataElement = dom.createElement('key');
      sourceDataElement.setAttribute('id', ncSourceUUID);
      sourceDataElement.setAttribute('attr.name', ncSourceUUID);
      sourceDataElement.setAttribute('attr.type', 'string');
      sourceDataElement.setAttribute('for', 'edge');
      fragment.appendChild(sourceDataElement);

      done.add('originalEdgeSource');
    }

    const entityKeys = generateKeysForEntities(
      entities as NodeWithResequencedID[] | EdgeWithResequencedID[] | NcEgo[],
      entityType,
      codebook,
      exportOptions,
      done,
    );

    fragment.appendChild(entityKeys);
    return fragment;
  };
}

function generateKeysForEntities(
  entities: NodeWithResequencedID[] | EdgeWithResequencedID[] | NcEgo[],
  entityType: 'node' | 'edge' | 'ego',
  codebook: Codebook,
  exportOptions: ExportOptions,
  done: Set<string>,
): DocumentFragment {
  const fragment = createDocumentFragment();
  const dom = new DOMImplementation().createDocument(null, 'root', null);

  // nodes and edges have for="node|edge" but ego has for="graph"
  const keyTarget = entityType === 'ego' ? 'graph' : entityType;

  // Loop over entities
  entities.forEach((entity) => {
    const elementAttributes = getEntityAttributes(entity);

    const codebookVariables = getCodebookVariablesForEntity(entity, codebook);

    // Loop over attributes for this entity
    Object.keys(elementAttributes).forEach((variableId) => {
      const codebookVariable = codebookVariables[variableId];

      // Test if we have already created a key for this variable, and that it
      // isn't on our exclude list.
      if (done.has(variableId) === false) {
        const keyElement = dom.createElement('key');

        // Determine variable type to decide how to encode it
        const variableType = get(codebookVariable, 'type');

        if (variableType) {
          // <key> id must be xs:NMTOKEN: http://books.xmlschemata.org/relaxng/ch19-77231.html
          // do not be tempted to change this to use the variable's name for this reason, as name
          // is not validated against xs:NMTOKEN.
          keyElement.setAttribute('id', variableId);
        } else {
          // If variableType is undefined, variable wasn't in the codebook (could be external data).
          // This means that key might not be a UUID, so update the key ID to be SHA1 of variable
          // name to ensure it is xs:NMTOKEN compliant
          const hashedKeyName = sha1(variableId);
          keyElement.setAttribute('id', hashedKeyName);
        }

        // transpose ids to names based on codebook; fall back to the raw key
        const keyName = get(codebookVariable, 'name', variableId);
        // Use human readable variable name for the attr.name attribute
        keyElement.setAttribute('attr.name', keyName);

        switch (variableType) {
          case 'boolean':
            keyElement.setAttribute('attr.type', variableType);
            break;
          case 'ordinal':
          case 'number': {
            const keyType = getGraphMLTypeForKey(entities, variableId);
            keyElement.setAttribute('attr.type', keyType);
            break;
          }
          case 'layout': {
            // special handling for layout variables: split the variable into
            // two <key> elements - one for X and one for Y.
            keyElement.setAttribute('attr.name', `${keyName}_Y`);
            keyElement.setAttribute('id', `${variableId}_Y`);
            keyElement.setAttribute('attr.type', 'double');

            // Create a second element to model the <key> for
            // the X value
            const keyElement2 = dom.createElement('key');
            keyElement2.setAttribute('id', `${variableId}_X`);
            keyElement2.setAttribute('attr.name', `${keyName}_X`);
            keyElement2.setAttribute('attr.type', 'double');
            keyElement2.setAttribute('for', keyTarget);
            fragment.appendChild(keyElement2);

            if (exportOptions.globalOptions.useScreenLayoutCoordinates) {
              // Create a third element to model the <key> for
              // the screen space Y value
              const keyElement3 = dom.createElement('key');
              keyElement3.setAttribute('id', `${variableId}_screenSpaceY`);
              keyElement3.setAttribute('attr.name', `${keyName}_screenSpaceY`);
              keyElement3.setAttribute('attr.type', 'double');
              keyElement3.setAttribute('for', keyTarget);
              fragment.appendChild(keyElement3);

              // Create a fourth element to model the <key> for
              // the screen space X value
              const keyElement4 = dom.createElement('key');
              keyElement4.setAttribute('id', `${variableId}_screenSpaceX`);
              keyElement4.setAttribute('attr.name', `${keyName}_screenSpaceX`);
              keyElement4.setAttribute('attr.type', 'double');
              keyElement4.setAttribute('for', keyTarget);
              fragment.appendChild(keyElement4);
            }

            break;
          }
          case 'categorical': {
            /*
             * Special handling for categorical variables:
             * Because categorical variables can have multiple membership, we
             * split them out into several boolean variables
             *
             * Because key id must be an xs:NMTOKEN, we hash the option value.
             */

            // fetch options property for this variable
            const options = get(codebookVariable, 'options')! as {
              value: string;
              label: string;
            }[];

            // If there are no options, we can't create keys for this variable
            if (!options) {
              return;
            }

            options.forEach((option, index) => {
              // Hash the value to ensure that it is NKTOKEN compliant
              const hashedOptionValue = sha1(option.value);

              if (index === options.length - 1) {
                keyElement.setAttribute(
                  'id',
                  `${variableId}_${hashedOptionValue}`,
                );
                keyElement.setAttribute(
                  'attr.name',
                  `${keyName}_${option.value}`,
                );
                keyElement.setAttribute('attr.type', 'boolean');
              } else {
                const keyElement2 = dom.createElement('key');
                keyElement2.setAttribute(
                  'id',
                  `${variableId}_${hashedOptionValue}`,
                );
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
          case 'scalar':
            keyElement.setAttribute('attr.type', 'float');
            break;
          case 'text':
          case 'datetime':
          default:
            keyElement.setAttribute('attr.type', 'string');
        }

        keyElement.setAttribute('for', keyTarget);
        fragment.appendChild(keyElement);
        done.add(variableId);
      }
    });
  });

  return fragment;
}
