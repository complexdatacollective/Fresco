import {
  type EntityDefinition,
  type FormField,
} from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebookVariablesForSubjectType } from './protocol';

export const selectFieldMetadata = createSelector(
  [getCodebookVariablesForSubjectType, (_, fields: FormField[]) => fields],
  (variables, fields) => {
    invariant(variables, 'Encountered a form whose subject has no variables');

    return fields.map(({ variable, prompt }) => {
      if (!variables[variable]) {
        throw new Error(`Missing codebook entry for variable: ${variable}`);
      }

      const codebookEntry = variables[variable] as NonNullable<
        EntityDefinition['variables']
      >[string];

      invariant(
        codebookEntry.component,
        'Missing component for codebook entry',
      );

      return {
        ...codebookEntry,
        label: prompt,
      };
    });
  },
);
