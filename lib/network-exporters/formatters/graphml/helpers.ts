import { NcEntity } from '@codaco/shared-consts';
import { isNil } from 'lodash';
import { getEntityAttributes } from '../../utils/general';

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
const getGraphMLTypeForKey = (data: NcEntity[], key: string) =>
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

const createElement = (
  xmlDoc: XMLDocument,
  tagName: string,
  attrs: Record<string, string>,
  child = null,
) => {
  const element = xmlDoc.createElement(tagName);
  Object.entries(attrs).forEach(([key, val]) => {
    element.setAttribute(key, val);
  });
  if (child) {
    element.appendChild(child);
  }
  return element;
};

const createDataElement = (
  xmlDoc: XMLDocument,
  attributes: Record<string, string>,
  text: string,
) => {
  const textNode = xmlDoc.createTextNode(text);
  const element = createElement(xmlDoc, 'data', attributes);
  element.appendChild(textNode);

  return element;
};

export { createDataElement, getGraphMLTypeForKey };
