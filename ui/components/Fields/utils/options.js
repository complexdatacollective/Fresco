/* eslint-disable import/prefer-default-export */

import { get, isString } from 'lodash';

const toString = (value) => (isString(value) ? value : JSON.stringify(value));
export const getValue = (option) => get(option, 'value', option);
export const getLabel = (option) => get(option, 'label', toString(getValue(option)));

export const asOptionObject = (option) => {
  if (typeof option !== 'string') { return option; }
  return {
    value: getValue(option),
    label: getLabel(option),
  };
};
