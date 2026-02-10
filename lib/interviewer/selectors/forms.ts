import { type FormField, type Variable } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebook } from '../ducks/modules/protocol';
import { getCodebookVariablesForSubjectType } from './protocol';
import { getNetwork, getStageSubject } from './session';

type CodebookVariableWithComponent = Extract<Variable, { component?: unknown }>;

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
        ...(codebookEntry as CodebookVariableWithComponent),
        variable,
        label: prompt,
      };
    });
  },
);

export const getValidationContext = createSelector(
  [getCodebook, getNetwork, getStageSubject],
  (codebook, network, stageSubject) => ({
    codebook,
    network,
    stageSubject,
  }),
);
