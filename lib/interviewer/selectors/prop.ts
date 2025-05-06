import { createSelector } from '@reduxjs/toolkit';
import { getCurrentPrompt } from './session';

// TODO: these used to use 'props' but i don't think that is needed. should they be moved, or
// deleted?
export const getAdditionalAttributesSelector = createSelector(
  getCurrentPrompt,
  (prompt) => {
    if (!prompt || !('additionalAttributes' in prompt)) {
      return {};
    }

    const promptAttributes = (prompt.additionalAttributes ?? []).reduce(
      (acc, { variable, value }) => ({
        ...acc,
        [variable]: value,
      }),
      {} as Record<string, boolean>,
    );

    return promptAttributes;
  },
);

export const getPromptVariable = createSelector(getCurrentPrompt, (prompt) => {
  if (!prompt || !('variable' in prompt)) {
    return null;
  }

  return prompt.variable;
});

export const getPromptOtherVariable = createSelector(
  getCurrentPrompt,
  (prompt) => {
    let otherVariable = null;
    if (prompt && 'otherVariable' in prompt) {
      otherVariable = prompt.otherVariable;
    }

    let otherOptionLabel = null;
    if (prompt && 'otherOptionLabel' in prompt) {
      otherOptionLabel = prompt.otherOptionLabel;
    }

    let otherVariablePrompt = null;
    if (prompt && 'otherVariablePrompt' in prompt) {
      otherVariablePrompt = prompt.otherVariablePrompt;
    }

    return [otherVariable, otherOptionLabel, otherVariablePrompt];
  },
);
