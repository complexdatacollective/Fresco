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
}

export default GraphMLFormatter;
