import { type FormField, type Variable } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { getCodebook } from '../ducks/modules/protocol';
import { getCodebookVariablesForSubjectType } from './protocol';
import { getNetwork, getStageSubject } from './session';

type CodebookVariableWithComponent = Extract<Variable, { component?: unknown }>;

export type Subject = {
  entity: 'node' | 'edge' | 'ego';
  type?: string;
};

/**
 * Selector that gets codebook variables for a subject passed as a prop.
 * This is used when the subject is known from component props rather than
 * from the current stage in Redux state.
 */
const getCodebookVariablesForProvidedSubject = createSelector(
  [getCodebook, (_state, subject: Subject | null) => subject],
  (codebook, subject) => {
    if (!subject) {
      return {};
    }

    if (subject.entity === 'ego') {
      return codebook?.ego?.variables ?? {};
    }

    const { entity, type } = subject;
    if (!type) {
      return {};
    }

    return codebook?.[entity]?.[type]?.variables ?? {};
  },
);

/**
 * Creates field metadata from form fields and codebook variables.
 * Used by useProtocolForm to convert protocol form definitions to Field components.
 */
const createFieldMetadata = (
  variables: Record<string, Variable>,
  fields: FormField[],
) => {
  // Return empty array if no variables (allows graceful handling during mount)
  if (!variables || Object.keys(variables).length === 0) {
    return [];
  }

  // Guard against invalid fields input
  if (!Array.isArray(fields)) {
    return [];
  }

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
};

/**
 * Select field metadata using the current stage subject from Redux state.
 */
export const selectFieldMetadata = createSelector(
  [getCodebookVariablesForSubjectType, (_, fields: FormField[]) => fields],
  createFieldMetadata,
);

/**
 * Select field metadata using a subject provided as a prop.
 * Use this when the subject is known from component props (e.g., in SlidesForm).
 */
export const selectFieldMetadataWithSubject = createSelector(
  [
    getCodebookVariablesForProvidedSubject,
    (_state, _subject: Subject | null, fields: FormField[]) => fields,
  ],
  createFieldMetadata,
);

export const getValidationContext = createSelector(
  [getCodebook, getNetwork, getStageSubject],
  (codebook, network, stageSubject) => ({
    codebook,
    network,
    stageSubject,
  }),
);
