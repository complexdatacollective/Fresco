import { type FormField, type Variable } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebookVariablesForSubjectType } from './protocol';

type VariableWithComponent = Extract<Variable, { component?: unknown }>;

export const selectFieldMetadata = createSelector(
  [getCodebookVariablesForSubjectType, (_, fields: FormField[]) => fields],
  (variables, fields) => {
    invariant(variables, 'Encountered a form whose subject has no variables');

    return fields.map(({ variable, prompt }) => {
      if (!variables[variable]) {
        throw new Error(`Missing codebook entry for variable: ${variable}`);
      }

      const codebookEntry = variables[variable];

      invariant(
        'component' in codebookEntry && codebookEntry.component !== undefined,
        'Missing component for codebook entry',
      );

      return {
        ...(codebookEntry as VariableWithComponent),
        label: prompt,
      };
    });
  },
);
