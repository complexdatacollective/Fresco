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
    return undefined;
  }

  return prompt.variable;
});

export const getPromptOtherVariable = createSelector(
  getCurrentPrompt,
  (prompt) => {
    if (
      !prompt ||
      !('otherVariable' in prompt) ||
      !('otherOptionLabel' in prompt) ||
      !('otherVariablePrompt' in prompt)
    ) {
      return [undefined, undefined, undefined];
    }

    const otherVariable = prompt.otherVariable as string;
    const otherOptionLabel = prompt.otherOptionLabel as string;
    const otherVariablePrompt = prompt.otherVariablePrompt as string;
    return [otherVariable, otherOptionLabel, otherVariablePrompt];
  },
);
