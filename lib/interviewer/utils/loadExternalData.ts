// import CSVWorker from './csvDecoder.worker';
import { type Codebook, type StageSubject } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import csv from 'csvtojson';
import { mapKeys } from 'es-toolkit';
import { hash } from 'ohash';
import getParentKeyByNameValue from './getParentKeyByNameValue';

/**
 * Converting data from CSV to our network JSON format is expensive, and so happens
 * inside of a worker to keep the app as responsive as possible.
 *
 * This function takes the result of the platform-specific file load operation,
 * and then initializes the conversion worker, before sending it the file contents
 * to decode.
 */
// const convertCSVToJsonWithWorker = (data) => new Promise((resolve, reject) => {
//   worker.postMessage(data);
//   worker.onerror = (event) => {
//     reject(event);
//   };
//   worker.onmessage = (event) => {
//     resolve(event.data);
//   };
// });

const CSVToJSONNetworkFormat = async (data: string) => {
  const withTypeAndAttributes = (node: NcNode[EntityAttributesProperty]) => ({
    [entityAttributesProperty]: {
      ...node,
    },
  });

  const network = (await csv().fromString(
    data,
  )) as NcNode[EntityAttributesProperty][];

  return network.map((entry) => withTypeAndAttributes(entry));
};

const convertCSVToJsonWithWorker = async (data: string) => {
  return CSVToJSONNetworkFormat(data);
};

/**
 * Loads network data from assets and appends objectHash uids.
 */
const loadExternalData = async (fileName: string, url: string) => {
  const isCSV = fileName.split('.').pop() === 'csv';

  const data = await fetch(url);
  let nodes: Partial<NcNode>[] = [];

  if (isCSV) {
    const text = await data.text();
    nodes = await convertCSVToJsonWithWorker(text);
  } else {
    const json = (await data.json()) as { nodes: Partial<NcNode>[] };
    nodes = json.nodes ?? [];
  }

  return { nodes };
};

export default loadExternalData;

// Replace string keys with UUIDs in codebook, according to stage subject.
export const makeVariableUUIDReplacer =
  (
    protocolCodebook: Codebook,
    subjectType: Extract<StageSubject, { entity: 'node' }>['type'],
  ) =>
  (node: Partial<NcNode>): NcNode => {
    const codebookDefinition = protocolCodebook.node?.[subjectType];

    const uuid = hash(node);

    const attributes = mapKeys(
      node.attributes!,
      (_attributeValue, attributeKey) =>
        getParentKeyByNameValue(
          codebookDefinition?.variables,
          attributeKey,
        ) as string,
    );

    return {
      type: subjectType,
      [entityPrimaryKeyProperty]: uuid,
      [entityAttributesProperty]: attributes,
    } as NcNode;
  };
