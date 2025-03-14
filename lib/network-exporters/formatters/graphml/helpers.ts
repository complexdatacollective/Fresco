import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { type Document } from '@xmldom/xmldom';
import { createHash } from 'crypto';
import { isNil } from 'es-toolkit';
import { getEntityAttributes } from '../../utils/general';

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
  xmlDoc: Document,
  attributes: Record<string, string>,
  text: string,
) => {
  const textNode = xmlDoc.createTextNode(text);
  const element = xmlDoc.createElement('data');
  Object.entries(attributes).forEach(([key, val]) => {
    element.setAttribute(key, val);
  });

  element.appendChild(textNode);

  return element;
};
