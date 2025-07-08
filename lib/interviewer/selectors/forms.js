import { createSelector } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import { getCodebook } from '../ducks/modules/protocol';

// Prop selectors

const propFields = (_, props) => props.fields || [];
const propStageSubject = (_, props) => props.subject || { entity: 'ego' };

// MemoedSelectors

const enrichFieldWithCodebookMetadata = ({ codebook, entity, type, field }) => {
  if (!field.variable) {
    return field;
  }

  const entityPath = entity === 'ego' ? [entity] : [entity, type];

  const entityProperties = get(
    codebook,
    [...entityPath, 'variables', field.variable],
    {},
  );

  return {
    ...entityProperties,
    name: field.variable,
    fieldLabel: field.prompt,
    value: field.value,
  };
};

export const enrichFieldsWithCodebookMetadata = createSelector(
  propStageSubject,
  propFields,
  (state, props) => getCodebook(state, props),
  ({ entity, type }, fields, codebook) =>
    fields.map((field) =>
      enrichFieldWithCodebookMetadata({
        codebook,
        entity,
        type,
        field,
      }),
    ),
);