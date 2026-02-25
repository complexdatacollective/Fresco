import { type Variable } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebookVariablesForSubjectType } from './protocol';

// Selectors that are generic between interfaces

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/
export const makeGetVariableOptions = createSelector(
  getCodebookVariablesForSubjectType,
  (variables) => {
    const variable = variables[promptVariable] as
      | Extract<Variable, { type: 'categorical' | 'ordinal' }>
      | undefined;

    invariant(
      variable,
      `Variable with ID ${promptVariable} not found in codebook for this stage's type`,
    );

    const otherValue = {
      label: promptOtherOptionLabel,
      value: null,
      otherVariablePrompt: promptOtherVariablePrompt,
      otherVariable: promptOtherVariable,
    };

    return includeOtherVariable && promptOtherVariable
      ? [...variable.options, otherValue]
      : variable.options;
  },
);
