// import CSVWorker from './csvDecoder.worker';
import { get } from './lodash-replacements';
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

const convertCSVToJsonWithWorker = async (data) => {
  const result = await csv().fromString(data);
  return result;
}


/**
 * Loads network data from assets and appends objectHash uids.
 *
 * @param {string} protocolUID - UID of the protocol
 * @param {string} fileName - Filename of the network assets
 * @returns {object} Network object in format { nodes, edges }
 *
 */
const loadExternalData = async (fileName, url) => {
  const isCSV = fileName.split('.').pop() === 'csv';

  try {
    const data = await fetch(url);
    let nodes;

    if (isCSV) {
      const text = await data.text();
      nodes = await convertCSVToJsonWithWorker(text);
    } else {
      const json = await data.json();
      nodes = get(json, 'nodes', []);
    }

    return ({ nodes });

  } catch (e) {
    console.error('error with LoadExternalData:', e);
    return null;
  }
};

export default loadExternalData;
