import { isEmpty } from 'es-toolkit/compat';

const CSSVariable = (variableName) => {
  // Check if document.body is available (SSR)
  if (typeof document === 'undefined' || !document.body) {
    return null;
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

export const getCSSVariableAsString = (variableName) =>
  CSSVariable(variableName);

// Coerce the CSS variable to a number
export const getCSSVariableAsNumber = (variableName) =>
  parseFloat(CSSVariable(variableName));
