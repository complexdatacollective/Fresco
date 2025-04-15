import { createSelector } from '@reduxjs/toolkit';

const asKeyValue = (acc, { variable, value }) => ({
  ...acc,
  [variable]: value,
});

// Prop selectors

const propStage = (_, props) => props?.stage ?? null;
const propPrompt = (_, props) => props?.prompt ?? null;
export const propStageId = (_, props) => props?.stage?.id ?? null;

export const getAdditionalAttributesSelector = createSelector(
  currentPro,
  (prompt) => {
    const promptAttributes = (prompt?.additionalAttributes ?? []).reduce(
      asKeyValue,
      {},
    );

    return promptAttributes;
  },
);

export const makeGetAdditionalAttributes = () =>
  getAdditionalAttributesSelector;

export const getPromptVariable = createSelector(
  propPrompt,
  (prompt) => prompt?.variable ?? null,
);

export const getPromptOtherVariable = createSelector(propPrompt, (prompt) => [
  prompt?.otherVariable ?? null,
  prompt?.otherOptionLabel ?? null,
  prompt?.otherVariablePrompt ?? null,
]);
