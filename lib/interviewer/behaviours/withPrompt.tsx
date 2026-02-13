import {
  type Prompt as BasePrompt,
  type EntityDefinition,
} from '@codaco/protocol-validation';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePrompt } from '../ducks/modules/session';
import { getAllVariableUUIDsByEntity } from '../selectors/protocol';
import { getPromptIndex, getPrompts } from '../selectors/session';
import {
  type ProcessedSortRule,
  processProtocolSortRule,
  type ProtocolSortRule,
} from '../utils/createSorter';

// Extended Prompt type with sort properties
type Prompt = BasePrompt & {
  bucketSortOrder?: ProtocolSortRule[];
  binSortOrder?: ProtocolSortRule[];
};

const processSortRules = (
  prompts: Prompt[] | null,
  codebookVariables: EntityDefinition['variables'],
) => {
  if (!prompts) {
    return [];
  }

  const sortProperties = ['bucketSortOrder', 'binSortOrder'] as const;

  const ruleProcessor = processProtocolSortRule(codebookVariables);

  return prompts.map((prompt) => {
    const sortOptions = {} as Record<
      (typeof sortProperties)[number],
      ProcessedSortRule[]
    >;

    sortProperties.forEach((property) => {
      if (property in prompt) {
        const sortRules = prompt[property as keyof Prompt] as
          | ProtocolSortRule[]
          | undefined;
        if (sortRules) {
          sortOptions[property] = sortRules.map(ruleProcessor);
        }
      }
    });
    return {
      ...prompt,
      ...sortOptions,
    };
  });
};

/**
 * @typedef {Object} Prompt
 * @property {string} id
 * @property {string} text
 * @property {string} [variable]
 * @property {string} [createEdge]
 * @property {string} [edgeVariable]
 *
 * @typedef {Array<Prompt>} Prompts
 *
 * @typedef {Object} PromptState
 * @property {number} promptIndex
 * @property {Prompt} prompt
 * @property {Prompts} prompts
 * @property {Function} promptForward
 * @property {Function} promptBackward
 * @property {Function} setPrompt
 * @property {boolean} isLastPrompt
 * @property {boolean} isFirstPrompt
 * @property {Function} updatePrompt
 *
 * @returns {PromptState}
 * @private
 *
 * @example
 * const {
 *  promptIndex,
 * prompt,
 * prompts,
 * promptForward,
 * promptBackward,
 * setPrompt,
 * isLastPrompt,
 * isFirstPrompt,
 * updatePrompt,
 * } = usePrompts();
 */
export const usePrompts = <T extends object = Prompt>() => {
  const dispatch = useDispatch();
  const setPrompt = useCallback(
    (promptIndex: number) => dispatch(updatePrompt(promptIndex)),
    [dispatch],
  );

  const codebookVariables = useSelector(getAllVariableUUIDsByEntity);
  const prompts = useSelector(getPrompts);

  const processedPrompts = processSortRules(prompts, codebookVariables) as T[];

  const promptIndex = useSelector(getPromptIndex);
  const isFirstPrompt = processedPrompts.length === 0;
  const isLastPrompt = promptIndex === processedPrompts.length - 1;

  const promptForward = () => {
    updatePrompt((promptIndex + 1) % processedPrompts.length);
  };

  const promptBackward = () => {
    updatePrompt(
      (promptIndex - 1 + processedPrompts.length) % processedPrompts.length,
    );
  };

  const currentPrompt = () => {
    return processedPrompts[promptIndex] ?? ({ id: null } as Prompt & T);
  };

  return {
    promptIndex,
    prompt: currentPrompt(),
    prompts: processedPrompts,
    promptForward,
    promptBackward,
    setPrompt,
    isLastPrompt,
    isFirstPrompt,
    updatePrompt,
  };
};
