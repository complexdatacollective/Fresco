import { createSelector } from "@reduxjs/toolkit";
import { get } from "~/utils/lodash-replacements";

const asKeyValue = (acc, { variable, value }) => ({
  ...acc,
  [variable]: value,
});

export const getAdditionalAttributes = (stage, prompt) => {
  const stageAttributes = get(stage, 'additionalAttributes', [])
    .reduce(asKeyValue, {});
  const promptAttributes = get(prompt, 'additionalAttributes', [])
    .reduce(asKeyValue, {});

  return {
    ...stageAttributes,
    ...promptAttributes,
  };
};

// Prop selectors

export const propStage = (_, props) => props.stage;
export const propPrompt = (_, props) => props.prompt;
export const propStageId = (_, props) => props.stage.id;
export const getPropPromptId = (_, props) => props.prompt.id;

export const getStageOrPromptSubject = (stage, prompt) => {
  return stage.subject || prompt.subject;
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

// Returns current stage and prompt ID
export const getIds = createSelector(
  propStageId, getPropPromptId,
  (stageId, promptId) => ({ stageId, promptId }),
);

export const makeGetIds = () => getIds;

export const getAdditionalAttributesSelector = createSelector(
  propStage, propPrompt,
  (stage, prompt) => getAdditionalAttributes(stage, prompt),
);

export const makeGetAdditionalAttributes = () => getAdditionalAttributesSelector;

export const getPromptVariable = createSelector(
  propPrompt,
  (prompt) => prompt.variable,
);

// TODO: Not sure this needs to be a createSelector
export const makeGetPromptVariable = () => getPromptVariable;

export const getPromptOtherVariable = createSelector(
  propPrompt,
  (prompt) => [prompt.otherVariable, prompt.otherOptionLabel, prompt.otherVariablePrompt],
)

export const stagePromptIds = createSelector(
  propStage,
  ({ prompts }) => {
    return prompts.map((prompt) => prompt.id);
  });