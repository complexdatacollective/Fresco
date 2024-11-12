import {
  type Codebook,
  type NcEgo,
  type NcEntity,
  ncSourceUUID,
  ncTargetUUID,
  ncTypeProperty,
  ncUUIDProperty,
  VariableType,
} from '@codaco/shared-consts';
import { type Document } from '@xmldom/xmldom';
import { type NcNetwork } from '~/schemas/network-canvas';
import {
  getAttributePropertyFromCodebook,
  getEntityAttributes,
} from '../../utils/general';
import { type ExportOptions } from '../../utils/types';
import { getGraphMLTypeForKey, sha1 } from './helpers';

// <key> elements provide the type definitions for GraphML data elements
export default function getKeyElementGenerator(
  document: Document,
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  return (
    entities: NcNetwork['nodes'] | NcNetwork['edges'] | NcEgo[],
    type: 'node' | 'edge' | 'ego',
  ) => {
    const fragment = document.createDocumentFragment();

    // track variables we have already created <key>s for
    const done = new Set();

    if (type === 'node' && done.has('type') === false) {
      const typeDataElement = document.createElement('key');
      typeDataElement.setAttribute('id', ncTypeProperty);
      typeDataElement.setAttribute('attr.name', ncTypeProperty);
      typeDataElement.setAttribute('attr.type', 'string');
      typeDataElement.setAttribute('for', 'all');
      fragment.appendChild(typeDataElement);
      done.add('type');
    }

    // Create a <key> for network canvas UUID.
    if (type === 'node' && done.has('uuid') === false) {
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
            {
              entity: type,
              type: entity.type ?? '',
            },
            key,
            'name',
          ) as string) ?? key;

        // Test if we have already created a key for this variable, and that it
        // isn't on our exclude list.
        if (done.has(key) === false) {
          const keyElement = document.createElement('key');

          // Determine attribute type to decide how to encode it
          const variableType = getAttributePropertyFromCodebook(
            codebook,
            type,
            {
              entity: type,
              type: entity.type ?? '',
            },
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
                keyElement3.setAttribute(
                  'attr.name',
                  `${keyName}_screenSpaceY`,
                );
                keyElement3.setAttribute('attr.type', 'double');
                keyElement3.setAttribute('for', keyTarget);
                fragment.appendChild(keyElement3);

                // Create a fourth element to model the <key> for
                // the screen space X value
                const keyElement4 = document.createElement('key');
                keyElement4.setAttribute('id', `${key}_screenSpaceX`);
                keyElement4.setAttribute(
                  'attr.name',
                  `${keyName}_screenSpaceX`,
                );
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
                {
                  entity: type,
                  type: entity.type ?? '',
                },
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
}
