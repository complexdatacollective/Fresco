import { isEmpty } from 'es-toolkit/compat';

const ensureLeadingZero = (value) => {
  if (value.startsWith('[') && value[1] === '.') {
     return '[0' + value.slice(1);
  }
  if (value.startsWith('.')) {
    return '0' + value;
  }

  return value;
};

const processCSSVariable = (variable) => {
  if (variable.includes(',')) {
    const processedValues = variable.split(',').map(item => ensureLeadingZero(item));
    return processedValues.join(',');
  }
  return ensureLeadingZero(variable);
}

const CSSVariable = (variableName) => {
  if (document.readyState !== 'complete') {
    // eslint-disable-next-line no-console
    // console.error('You attempted to read the value of a CSS variable before all app resources were loaded! Move calls to getCSSVariableAs* outside of the top level scope of your components.');
  }

  const variable = getComputedStyle(document.body)
    .getPropertyValue(variableName)
    .trim();
  if (isEmpty(variable)) {
    // eslint-disable-next-line no-console
    console.warn(`CSS variable "${variableName}" not found!`);
    return null;
  }
  return processCSSVariable(variable);
};

export const getCSSVariableAsString = (variableName) =>
  CSSVariable(variableName);

export const getCSSVariableAsNumber = (variableName) =>
  parseInt(CSSVariable(variableName), 10);

export const getCSSVariableAsObject = (variableName) =>
  JSON.parse(CSSVariable(variableName));
