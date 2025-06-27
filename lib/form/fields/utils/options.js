import { isString } from 'es-toolkit';
import { get } from 'es-toolkit/compat';

const toString = (value) => (isString(value) ? value : JSON.stringify(value));
export const getValue = (option) => get(option, 'value', option);
const getLabel = (option) => get(option, 'label', toString(getValue(option)));

export const asOptionObject = (option) => {
  if (typeof option !== 'string') {
    return option;
  }
  return {
    value: getValue(option),
    label: getLabel(option),
  };
};
