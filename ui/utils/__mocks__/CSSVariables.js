import { get, isEmpty } from 'lodash';

const mockCSSVariables = {
  '--light-background': '#227733',
  '--color-mustard': '#117733',
  '--color-sea-green': '#223344',
  '--white': '#fff',
  '--ring': '#995522',
  '--background': '#227733',
  '--animation-scale-factor': 1,
  '--animation-duration-fast': `${(1 * 0.3)}s`,
  '--animation-duration-fast-ms': 1000 * 0.3,
  '--animation-duration-standard': `${(1 * 0.5)}s`,
  '--animation-duration-standard-ms': 1000 * 0.5,
  '--animation-duration-slow': `${(1 * 1)}s`,
  '--animation-duration-slow-ms': 1000 * 1,
  '--animation-easing': 'cubic-bezier(0.4, 0, 0.2, 1)',
  '--animation-easing-js': '[0.4, 0, 0.2, 1]',
};

const CSSVariable = (variableName) => {
  if (document.readyState !== 'complete') {
    // eslint-disable-next-line no-console
    console.error('You attempted to read the value of a CSS variable before all app resources were loaded! Move calls to getCSSVariableAs* outside of the top level scope of your components.');
  }

  const variable = get(mockCSSVariables, variableName);

  if (isEmpty(variable)) {
    // In development and production, we issue a warning here.
    // This is removed in the mock to avoid console noise for components that don't depend on a
    // specific CSS variable value for their test.
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
