import { type Codebook } from '@codaco/protocol-validation';
import { type NcEgo } from '@codaco/shared-consts';
import { type DocumentFragment } from '@xmldom/xmldom';
import { getEntityAttributes } from '../../utils/general';
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

    if (codebookEntry?.type === 'categorical') {
      const options = codebookEntry.options;

      options.forEach((option) => {
        const hashedOptionValue = sha1(String(option.value));
        const optionKey = `${key}_${hashedOptionValue}`;

        const attributeValue = entityAttributes[key] as string[] | number[]; // type narrowed to this because these are valid categorical variable values
        createDomDataElement(optionKey, String(attributeValue));
      });

      return;
    }

    if (codebookEntry?.type === 'layout') {
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
        const screenSpaceYCoord = ((1.0 - yCoord) * screenLayoutHeight).toFixed(
          2,
        );

        createDomDataElement(`${key}_screenSpaceX`, screenSpaceXCoord);
        createDomDataElement(`${key}_screenSpaceY`, screenSpaceYCoord);
      }

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    createDomDataElement(key, String(entityAttributes[key]));
  });

  return fragment;
}

export default processAttributes;
