import { isEmpty } from 'lodash';

const CSSVariable = (variableName) => {
  if (document.readyState !== 'complete') {
    // eslint-disable-next-line no-console
    console.error('You attempted to read the value of a CSS variable before all app resources were loaded! Move calls to getCSSVariableAs* outside of the top level scope of your components.');
  }

  const variable = getComputedStyle(document.body)
    .getPropertyValue(variableName)
    .trim();
  if (isEmpty(variable)) {
    // eslint-disable-next-line no-console
    console.warn(`CSS variable "${variableName}" not found!`);
    return null;
  }
  return variable;
};

export const getCSSVariableAsString = (variableName) => CSSVariable(variableName);

export const getCSSVariableAsNumber = (variableName) => parseInt(CSSVariable(variableName), 10);

export const getCSSVariableAsObject = (variableName) => JSON.parse(CSSVariable(variableName));

export const getCSSVariable = (variableName) => {
  const variable = CSSVariable(variableName);

  try {
    return JSON.parse(variable);
  } catch (e) {
    if (parseInt(variable, 10).toString() === variable) {
      return parseInt(variable, 10);
    }

    return variable;
  }
};
