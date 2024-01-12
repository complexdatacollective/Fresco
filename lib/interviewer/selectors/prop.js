import { createSelector } from "@reduxjs/toolkit";

const asKeyValue = (acc, { variable, value }) => ({
  ...acc,
  [variable]: value,
});

export const getAdditionalAttributes = (stage, prompt) => {
  const stageAttributes = (stage?.additionalAttributes ?? [])
    .reduce(asKeyValue, {});
  const promptAttributes = (prompt?.additionalAttributes ?? [])
    .reduce(asKeyValue, {});

  return {
    ...stageAttributes,
    ...promptAttributes,
  };
};

// Prop selectors

export const propStage = (_, props) => props?.stage ?? null;
export const propPrompt = (_, props) => props?.prompt ?? null;
export const propStageId = (_, props) => props?.stage?.id ?? null;

export const getStageOrPromptSubject = (stage, prompt) => {
  return stage?.subject || prompt?.subject || null;
}

export const getStageSubject = createSelector(
  propStage, propPrompt,
  (stage, prompt) => getStageOrPromptSubject(stage, prompt),
)

export const getSubjectType = createSelector(
  getStageSubject,
  (subject) => {
    return subject?.type ?? null;
  },
);

export const makeGetSubject = () => getStageSubject;

export const getAdditionalAttributesSelector = createSelector(
  propStage, propPrompt,
  (stage, prompt) => getAdditionalAttributes(stage, prompt),
);

export const makeGetAdditionalAttributes = () => getAdditionalAttributesSelector;

export const getPromptVariable = createSelector(
  propPrompt,
  (prompt) => prompt?.variable ?? null,
);

// TODO: Not sure this needs to be a createSelector
export const makeGetPromptVariable = () => getPromptVariable;

export const getPromptOtherVariable = createSelector(
  propPrompt,
  (prompt) => [prompt?.otherVariable ?? null, prompt?.otherOptionLabel ?? null, prompt?.otherVariablePrompt ?? null],
)

export const stagePromptIds = createSelector(
  propStage,
  ({ prompts }) => {
    return prompts.map((prompt) => prompt.id);
  });