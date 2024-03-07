import { Readable } from 'stream';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  caseProperty,
  egoProperty,
  sessionProperty,
  protocolName,
  sessionStartTimeProperty,
  sessionFinishTimeProperty,
  sessionExportTimeProperty,
  ncCaseProperty,
  ncSessionProperty,
  ncProtocolNameProperty,
} from '@codaco/shared-consts';
import { processEntityVariables } from '../network';
import { sanitizedCellValue, csvEOL } from './csv';

const asEgoAndSessionVariablesList = (network, codebook, exportOptions) => {
  if (exportOptions.globalOptions.unifyNetworks) {
    // If unified networks is enabled, network.ego is an object keyed by sessionID.
    return Object.keys(network.ego).map((sessionID) =>
      processEntityVariables(
        {
          ...network.ego[sessionID],
          ...network.sessionVariables[sessionID],
        },
        'ego',
        codebook,
        exportOptions,
      ),
    );
  }

  return [
    processEntityVariables(
      {
        ...network.ego,
        ...network.sessionVariables,
      },
      'ego',
      codebook,
      exportOptions,
    ),
  ];
};

/**
 * The output of this formatter will contain the primary key (_uid)
 * and all model data (inside the `attributes` property)
 */
const attributeHeaders = (egos) => {
  const initialHeaderSet = new Set([]);

  // Create initial headers for non-attribute (model) variables such as sessionID
  initialHeaderSet.add(entityPrimaryKeyProperty);
  initialHeaderSet.add(caseProperty);
  initialHeaderSet.add(sessionProperty);
  initialHeaderSet.add(protocolName);
  initialHeaderSet.add(sessionStartTimeProperty);
  initialHeaderSet.add(sessionFinishTimeProperty);
  initialHeaderSet.add(sessionExportTimeProperty);
  initialHeaderSet.add('APP_VERSION');
  initialHeaderSet.add('COMMIT_HASH');

  const headerSet = egos.reduce((headers, ego) => {
    // Add headers for attributes
    Object.keys((ego && ego[entityAttributesProperty]) || {}).forEach((key) => {
      headers.add(key);
    });

    return headers;
  }, initialHeaderSet);
  return [...headerSet];
};

const getPrintableAttribute = (attribute) => {
  switch (attribute) {
    case caseProperty:
      return ncCaseProperty;
    case sessionProperty:
      return ncSessionProperty;
    case protocolName:
      return ncProtocolNameProperty;
    case entityPrimaryKeyProperty:
      return egoProperty;
    default:
      return attribute;
  }
};

/**
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
const toCSVStream = (egos, outStream) => {
  const totalRows = egos.length;
  const attrNames = attributeHeaders(egos);
  let headerWritten = false;
  let rowIndex = 0;
  let rowContent;
  let ego;

  const inStream = new Readable({
    read(/* size */) {
      if (!headerWritten) {
        this.push(
          `${attrNames
            .map((attr) => sanitizedCellValue(getPrintableAttribute(attr)))
            .join(',')}${csvEOL}`,
        );
        headerWritten = true;
      } else if (rowIndex < totalRows) {
        ego = egos[rowIndex] || {};
        const values = attrNames.map((attrName) => {
          // Session variables exist at the top level - all others inside `attributes`
          let value;
          if (
            attrName === entityPrimaryKeyProperty ||
            attrName === caseProperty ||
            attrName === sessionProperty ||
            attrName === protocolName ||
            attrName === sessionStartTimeProperty ||
            attrName === sessionFinishTimeProperty ||
            attrName === sessionExportTimeProperty ||
            attrName === 'APP_VERSION' ||
            attrName === 'COMMIT_HASH'
          ) {
            value = ego[attrName];
          } else {
            value = ego[entityAttributesProperty][attrName];
          }
          return sanitizedCellValue(value);
        });
        rowContent = `${values.join(',')}${csvEOL}`;
        this.push(rowContent);
        rowIndex += 1;
      } else {
        this.push(null);
      }
    },
  });

  // TODO: handle teardown. Use pipeline() API in Node 10?
  inStream.pipe(outStream);

  return {
    abort: () => {
      inStream.destroy();
    },
  };
};

class EgoListFormatter {
  constructor(network, codebook, exportOptions) {
    this.list =
      asEgoAndSessionVariablesList(network, codebook, exportOptions) || [];
  }

  writeToStream(outStream) {
    return toCSVStream(this.list, outStream);
  }
}

export { EgoListFormatter, asEgoAndSessionVariablesList, toCSVStream };
