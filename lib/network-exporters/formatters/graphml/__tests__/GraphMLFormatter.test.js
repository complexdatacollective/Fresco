import { beforeEach, describe, expect, it } from 'vitest';
import { makeWriteableStream } from '~/lib/network-exporters/utils/setupTestEnv.js';
import { mockCodebook, mockNetwork } from '../../csv/__tests__/mockObjects';
import GraphMLFormatter from '../GraphMLFormatter';

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
