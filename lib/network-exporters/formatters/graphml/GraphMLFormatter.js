import { Readable } from 'stream';
import graphMLGenerator from './createGraphML';

/** Class providing a graphML formatter. */
class GraphMLFormatter {
  /**
   * Create a graphML formatter.
   * @param {Object} network - a NC format network object.
   * @param {Object} codebook - the codebook for this network.
   * @param {Object} exportOptions - global export options object from FileExportManager.
   */
  constructor(network, codebook, exportOptions) {
    this.network = network;
    this.codebook = codebook;
    this.exportOptions = exportOptions;
  }

  streamToString = (stream) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  };

  /**
   * A method allowing writing the file to a string. Used for tests.
   */
  writeToString() {
    const generator = graphMLGenerator(
      this.network,
      this.codebook,
      this.exportOptions,
    );

    const inStream = new Readable({
      read(/* size */) {
        const { done, value } = generator.next();
        if (done) {
          this.push(null);
        } else {
          this.push(value);
        }
      },
    });

    return this.streamToString(inStream);
  }

  /**
   * Write the file to a stream one chunk at a time.
   * @param {Stream} outStream
   */
  writeToStream(outStream) {
    const generator = graphMLGenerator(
      this.network,
      this.codebook,
      this.exportOptions,
    );
    const inStream = new Readable({
      read(/* size */) {
        const { done, value } = generator.next();
        if (done) {
          this.push(null);
        } else {
          this.push(value);
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
  }
}

export default GraphMLFormatter;
