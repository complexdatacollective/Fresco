import {
  type Codebook,
  caseProperty,
  codebookHashProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
import { type ExportOptions } from '../../utils/types';
import { type ExportFileNetwork } from '../session/exportFile';
import getDataElementGenerator from './generateDataElements';
import getKeyElementGenerator from './generateKeyElements';

const setUpXml = (sessionVariables: ExportFileNetwork['sessionVariables']) => {
  const doc = new DOMImplementation().createDocument(null, 'graphml', null);

  // Set the necessary namespaces and attributes
  const root = doc.documentElement!;
  root.setAttribute('xmlns', 'http://graphml.graphdrawing.org/xmlns');
  root.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
  root.setAttribute(
    'xsi:schemaLocation',
    'http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd',
  );
  root.setAttribute('xmlns:nc', 'http://schema.networkcanvas.com/xmlns');

  const pi = doc.createProcessingInstruction(
    'xml',
    'version="1.0" encoding="UTF-8"',
  );
  doc.insertBefore(pi, doc.firstChild);

  // Create the graph element
  const graph = doc.createElement('graph');

  // Add attributes
  graph.setAttribute('edgedefault', 'undirected');
  graph.setAttribute('nc:caseId', sessionVariables[caseProperty]);
  graph.setAttribute('nc:sessionUUID', sessionVariables[sessionProperty]);
  graph.setAttribute('nc:protocolName', sessionVariables[protocolName]);
  graph.setAttribute('nc:protocolUID', sessionVariables[protocolProperty]);
  graph.setAttribute('nc:codebookHash', sessionVariables[codebookHashProperty]);
  graph.setAttribute(
    'nc:sessionExportTime',
    sessionVariables[sessionExportTimeProperty],
  );

  if (sessionVariables[sessionStartTimeProperty]) {
    graph.setAttribute(
      'nc:sessionStartTime',
      sessionVariables[sessionStartTimeProperty],
    );
  }

  if (sessionVariables[sessionFinishTimeProperty]) {
    graph.setAttribute(
      'nc:sessionFinishTime',
      sessionVariables[sessionFinishTimeProperty],
    );
  }

  root.appendChild(graph);

  return doc;
};

/**
 * Generator function to supply XML content in chunks to both string and stream producers
 * @param {*} network
 * @param {*} codebook
 * @param {*} exportOptions
 */
function* graphMLGenerator(
  network: ExportFileNetwork,
  codebook: Codebook,
  exportOptions: ExportOptions,
) {
  const xmlDoc = setUpXml(network.sessionVariables);
  const keyGenerator = getKeyElementGenerator(xmlDoc, codebook, exportOptions);
  const dataGenerator = getDataElementGenerator(
    xmlDoc,
    codebook,
    exportOptions,
  );

  // get the graphML element, which is where keys are appended
  const graphMLElement = xmlDoc.getElementsByTagName('graphml')[0]!;

  // Create <key> for a 'label' variable for display in Gephi.
  const labelDataElement = xmlDoc.createElement('key');
  labelDataElement.setAttribute('id', 'label');
  labelDataElement.setAttribute('attr.name', 'label');
  labelDataElement.setAttribute('attr.type', 'string');
  labelDataElement.setAttribute('for', 'all');

  graphMLElement.appendChild(labelDataElement);

  // generate keys for ego, nodes, edges
  graphMLElement.appendChild(keyGenerator([network.ego], 'ego'));
  graphMLElement.appendChild(keyGenerator(network.nodes, 'node'));
  graphMLElement.appendChild(keyGenerator(network.edges, 'edge'));

  // get the graph element, since this is what we will mostly be appending to
  const graphElement = xmlDoc.getElementsByTagName('graph')[0]!;

  // Add ego to graph
  if (network.ego && codebook.ego) {
    graphElement.appendChild(dataGenerator([network.ego], 'ego'));
  }

  // add nodes and edges to graph
  if (network.nodes) {
    graphElement.appendChild(dataGenerator(network.nodes, 'node'));
  }

  if (network.edges) {
    graphElement.appendChild(dataGenerator(network.edges, 'edge'));
  }

  // Serialize the XML document
  const serializer = new XMLSerializer();
  yield serializer.serializeToString(xmlDoc);
}

export default graphMLGenerator;
