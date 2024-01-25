/* eslint-env jest */

import { Writable } from 'stream';
import { mockNetwork, mockCodebook } from '../../../../config/mockObjects';
import GraphMLFormatter from '../GraphMLFormatter';

const makeWriteableStream = () => {
  const chunks = [];

  const writable = new Writable({
    write(chunk, encoding, next) {
      chunks.push(chunk.toString());
      next(null);
    },
  });

  writable.asString = async () => new Promise((resolve, reject) => {
    writable.on('finish', () => { resolve(chunks.join('')); });
    writable.on('error', (err) => { reject(err); });
  });

  return writable;
};

describe('GraphMLFormatter writeToStream', () => {
  let network;
  let codebook;
  let writable;
  let exportOptions;

  beforeEach(() => {
    writable = makeWriteableStream();
    network = mockNetwork;
    codebook = mockCodebook;
    exportOptions = {
      exportGraphML: true,
      exportCSV: false,
      globalOptions: {
        resequenceIDs: false,
        unifyNetworks: false,
        useDirectedEdges: false,
      },
    };
  });

  it('returns an abort controller', () => {
    const formatter = new GraphMLFormatter(network, codebook, exportOptions);
    const controller = formatter.writeToStream(writable);
    expect(controller.abort).toBeInstanceOf(Function);
  });

  it('produces XML', async () => {
    const formatter = new GraphMLFormatter(network, codebook, exportOptions);
    formatter.writeToStream(writable);
    const xml = await writable.asString();
    expect(xml).toMatch('<graphml');
  });
});
