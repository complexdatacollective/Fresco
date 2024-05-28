// import CSVWorker from './csvDecoder.worker';
import { entityAttributesProperty } from '@codaco/shared-consts';
import csv from 'csvtojson';

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


const CSVToJSONNetworkFormat = async (data) => {
  const withTypeAndAttributes = (node) => ({
    [entityAttributesProperty]: {
      ...node,
    },
  });

  const network = await csv().fromString(data);

  return network.map((entry) => withTypeAndAttributes(entry));
};

const convertCSVToJsonWithWorker = async (data) => {
  return CSVToJSONNetworkFormat(data);
}


/**
 * Async function that loads network data from URL, and returns a node list
 * of type NcNode[] or null if the data could not be loaded.
 * @param {string} url - URL of the network data
 * @param {boolean} isCSV - Whether the data is in CSV format
 * @returns {Promise<NcNode[]>} - List of nodes or null
 */
const loadExternalData = async (url, isCSV = false) => {
  const data = await fetch(url);
  let nodes;

  if (isCSV) {
    const text = await data.text();
    nodes = await convertCSVToJsonWithWorker(text);
  } else {
    const json = await data.json();
    nodes = json.nodes ?? [];
  }

  return nodes;
};

export default loadExternalData;
