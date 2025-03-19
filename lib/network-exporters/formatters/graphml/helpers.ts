import { type Codebook, type Variable } from '@codaco/protocol-validation';
import {
  caseProperty,
  codebookHashProperty,
  edgeSourceProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { DOMImplementation } from '@xmldom/xmldom';
import { createHash } from 'crypto';
import { isNil } from 'es-toolkit';
import { getEntityAttributes } from '../../utils/general';
import {
  type EdgeWithResequencedID,
  type NodeWithResequencedID,
} from '../../utils/types';
import { type ExportFileNetwork } from '../session/exportFile';

export function getCodebookVariablesForEntity(
  entity: NodeWithResequencedID | EdgeWithResequencedID | NcEgo,
  codebook: Codebook,
) {
  const entityType = deriveEntityType(entity);
  // Fetch the codebook variables for this entity
  let codebookVariables: Record<string, Variable>;
  if ('type' in entity) {
    codebookVariables =
      codebook[entityType as 'node' | 'edge']?.[entity.type]?.variables ?? {};
  } else {
    codebookVariables = codebook.ego?.variables ?? {};
  }

  return codebookVariables;
}

export function deriveEntityType(
  entities:
    | NodeWithResequencedID[]
    | EdgeWithResequencedID[]
    | NcEgo
    | NcNode
    | NcEdge,
) {
  if (!Array.isArray(entities)) {
    return 'type' in entities
      ? Object.prototype.hasOwnProperty.call(entities, edgeSourceProperty)
        ? 'edge'
        : 'node'
      : 'ego';
  }

  return Object.prototype.hasOwnProperty.call(entities[0], edgeSourceProperty)
    ? 'edge'
    : 'node';
}

export function createDocumentFragment() {
  const dom = new DOMImplementation().createDocument(null, 'root', null);
  const fragment = dom.createDocumentFragment();

  return fragment;
}

export const setUpXml = (
  sessionVariables: ExportFileNetwork['sessionVariables'],
) => {
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

  // Create <key> for a 'label' variable for display in Gephi.
  const labelDataElement = doc.createElement('key');
  labelDataElement.setAttribute('id', 'label');
  labelDataElement.setAttribute('attr.name', 'label');
  labelDataElement.setAttribute('attr.type', 'string');
  labelDataElement.setAttribute('for', 'all');
  doc.appendChild(labelDataElement);

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

// Utility sha1 function that returns hashed text
export const sha1 = (text: string) => {
  return createHash('sha1').update(text, 'utf8').digest('hex');
};

/**
 * For a given key, return a valid Graphml data 'type' for encoding
 * Graphml types are extended from xs:NMTOKEN:
 *   - boolean
 *   - int
 *   - long
 *   - float
 *   - double
 *   - string
 *
 * @param {*} data
 * @param {*} key
 */
export const getGraphMLTypeForKey = (data: NcNode[] | NcEdge[], key: string) =>
  data.reduce((result, value) => {
    const attrs = getEntityAttributes(value);
    if (isNil(attrs[key])) return result;
    let currentType = typeof attrs[key];
    if (currentType === 'number') {
      currentType = Number.isInteger(attrs[key]) ? 'int' : 'double';
      if (result && currentType !== result) return 'double';
    }
    if (String(Number.parseInt(attrs[key], 10)) === attrs[key]) {
      currentType = 'int';
      if (result === 'double') return 'double';
    } else if (String(Number.parseFloat(attrs[key], 10)) === attrs[key]) {
      currentType = 'double';
      if (result === 'int') return 'double';
    }
    if (isNil(currentType)) return result;
    if (currentType === result || result === '') return currentType;
    return 'string';
  }, '');

export const createDataElement = (
  attributes: Record<string, string>,
  text: string,
) => {
  const dom = new DOMImplementation().createDocument(null, 'root', null);
  const textNode = dom.createTextNode(text);
  const element = dom.createElement('data');
  Object.entries(attributes).forEach(([key, val]) => {
    element.setAttribute(key, val);
  });

  element.appendChild(textNode);

  return element;
};
