import { isNil } from 'es-toolkit';
import { getEntityAttributes } from '~/utils/general';

// Gephi does not support long lines in graphML, meaning we need to "beautify" the output
const formatXml = (xml, tab = '\t') => {
  // tab = optional indent value, default is tab (\t)
  let formatted = '';
  let indent = '';

  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
    formatted += `${indent}<${node}>\r\n`;
    if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
  });
  return formatted.substring(1, formatted.length - 3);
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
const getGraphMLTypeForKey = (data, key) =>
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

const createElement = (xmlDoc, tagName, attrs = {}, child = null) => {
  const element = xmlDoc.createElement(tagName);
  Object.entries(attrs).forEach(([key, val]) => {
    element.setAttribute(key, val);
  });
  if (child) {
    element.appendChild(child);
  }
  return element;
};

const createDataElement = (xmlDoc, attributes, text) =>
  createElement(xmlDoc, 'data', attributes, xmlDoc.createTextNode(text));

export { createDataElement, formatXml, getGraphMLTypeForKey };
