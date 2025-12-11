import type { Codebook } from '@codaco/protocol-validation';
import { XMLSerializer } from '@xmldom/xmldom';
import { type ExportOptions } from '../../utils/types';
import { type ExportFileNetwork } from '../session/exportFile';
import getDataElementGenerator from './generateDataElements';
import getKeyElementGenerator from './generateKeyElements';
import { setUpXml } from './helpers';

/**
 * Generator function to supply XML content in chunks to both string and stream producers
 * @param {*} network
 * @param {*} codebook
 * @param {*} exportOptions
 */
function graphMLGenerator(
  network: ExportFileNetwork,
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  const xmlDoc = setUpXml(network.sessionVariables);

  const generateKeyElements = getKeyElementGenerator(codebook, exportOptions);
  const generateDataElements = getDataElementGenerator(codebook, exportOptions);

  // <graphml /> is where <key /> elements are attached
  const graphMLElement = xmlDoc.getElementsByTagName('graphml')[0]!;

  // <graph /> is where <data />, <node />, and <edge /> elements are attached
  const graphElement = xmlDoc.getElementsByTagName('graph')[0]!;

  if (network.ego) {
    graphMLElement.insertBefore(generateKeyElements(network.ego), graphElement);
    graphElement.appendChild(generateDataElements(network.ego));
  }

  graphMLElement.insertBefore(generateKeyElements(network.nodes), graphElement);
  graphElement.appendChild(generateDataElements(network.nodes));

  graphMLElement.insertBefore(generateKeyElements(network.edges), graphElement);
  graphElement.appendChild(generateDataElements(network.edges));

  // Serialize the XML document
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

export default graphMLGenerator;
