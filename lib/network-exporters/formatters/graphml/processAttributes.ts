import { type Codebook } from '@codaco/protocol-validation';
import { type NcEgo } from '@codaco/shared-consts';
import { type DocumentFragment } from '@xmldom/xmldom';
import {
  getEntityAttributes,
  isCategoricalOptionSelected,
} from '../../utils/general';
import {
  type EdgeWithResequencedID,
  type ExportOptions,
  type NodeWithResequencedID,
} from '../../utils/types';
import {
  createDataElement,
  createDocumentFragment,
  getCodebookVariablesForEntity,
  sha1,
} from './helpers';

/**
 * Function for processing attributes of an entity. Processing means creating
 * one or more <data> elements for each attribute.
 */
function processAttributes(
  entity: NodeWithResequencedID | EdgeWithResequencedID | NcEgo,
  codebook: Codebook,
  exportOptions: ExportOptions,
): DocumentFragment {
  const fragment = createDocumentFragment();

  const createDomDataElement = (key: string, value: string) => {
    const dataElement = createDataElement({ key }, value);
    fragment.appendChild(dataElement);
  };

  const variables = getCodebookVariablesForEntity(entity, codebook);
  const entityAttributes = getEntityAttributes(entity);

  Object.entries(entityAttributes).forEach(([key, value]) => {
    // Don't process empty values.
    if (value === null) {
      return;
    }

    const codebookEntry = variables?.[key];

    // If there's no codebook entry for type, treat it as a string
    // TODO: try to detect the type from the value.
    if (!codebookEntry) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      createDomDataElement(key, String(value));
      return;
    }

    const variableIsEncrypted = codebookEntry.encrypted;

    switch (codebookEntry.type) {
      case 'categorical': {
        const options = codebookEntry.options;

        if (variableIsEncrypted) {
          // If the variable is encrypted, we don't want to export it.
          options.forEach((option) => {
            const hashedOptionValue = sha1(String(option.value));
            const optionKey = `${key}_${hashedOptionValue}`;

            createDomDataElement(optionKey, 'ENCRYPTED');
          });
          return;
        }

        options.forEach((option) => {
          const hashedOptionValue = sha1(String(option.value));
          const optionKey = `${key}_${hashedOptionValue}`;

          const attributeValue = entityAttributes[key];
          const isSelected = isCategoricalOptionSelected(
            attributeValue,
            option.value,
          );
          createDomDataElement(optionKey, isSelected ? 'true' : 'false');
        });

        break;
      }
      case 'layout': {
        if (variableIsEncrypted) {
          // If the variable is encrypted, we don't want to export it.
          createDomDataElement(`${key}_X`, 'ENCRYPTED');
          createDomDataElement(`${key}_Y`, 'ENCRYPTED');
          return;
        }

        const { x: xCoord, y: yCoord } = entityAttributes[key] as {
          x: number;
          y: number;
        };

        createDomDataElement(`${key}_X`, String(xCoord));
        createDomDataElement(`${key}_Y`, String(yCoord));

        if (exportOptions.globalOptions.useScreenLayoutCoordinates) {
          const { screenLayoutWidth, screenLayoutHeight } =
            exportOptions.globalOptions;
          const screenSpaceXCoord = (xCoord * screenLayoutWidth).toFixed(2);
          const screenSpaceYCoord = (
            (1.0 - yCoord) *
            screenLayoutHeight
          ).toFixed(2);

          createDomDataElement(`${key}_screenSpaceX`, screenSpaceXCoord);
          createDomDataElement(`${key}_screenSpaceY`, screenSpaceYCoord);
        }
        break;
      }

      case 'boolean':
      case 'number':
      case 'text':
      case 'datetime':
      case 'location':
      case 'ordinal':
      case 'scalar': {
        if (variableIsEncrypted) {
          createDomDataElement(key, 'ENCRYPTED');
          return;
        }

        const rawValue = value as string | number | boolean | unknown[];
        // Cooerce value to string
        const coercedValue = String(rawValue);
        createDomDataElement(key, coercedValue);
        break;
      }
    }
  });

  return fragment;
}

export default processAttributes;
