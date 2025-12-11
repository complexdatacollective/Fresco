import { type Codebook } from '@codaco/protocol-validation';
import { type WriteStream } from 'node:fs';
import { type ExportOptions } from '../../utils/types';
import { type ExportFileNetwork } from '../session/exportFile';
import graphMLGenerator from './createGraphML';

/** Class providing a graphML formatter. */
class GraphMLFormatter {
  network: ExportFileNetwork;
  codebook: Codebook;
  exportOptions: ExportOptions;

  constructor(
    network: ExportFileNetwork,
    codebook: Codebook,
    exportOptions: ExportOptions,
  ) {
    this.network = network;
    this.codebook = codebook;
    this.exportOptions = exportOptions;
  }
  /**
   * A method allowing writing the file to a string. Used for tests.
   */
  writeToString() {
    const generator = graphMLGenerator(
      this.network,
      this.codebook,
      this.exportOptions,
    );

    return generator;
  }

  writeToStream(outStream: WriteStream) {
    // We can't actually write to a stream, so we will call the writeToString
    // method, and then write the string to the stream.
    const string = this.writeToString();
    outStream.write(string);
    outStream.end();
  }
}

export default GraphMLFormatter;
