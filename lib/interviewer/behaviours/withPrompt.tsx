import {
  type EntityDefinition,
  type Prompt,
} from '@codaco/protocol-validation';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePrompt } from '../ducks/modules/session';
import { getAllVariableUUIDsByEntity } from '../selectors/protocol';
import { getPromptIndex, getPrompts } from '../selectors/session';
import { processProtocolSortRule } from '../utils/createSorter';

/**
 * Convert sort rules to new format. See `processProtocolSortRule` for details.
 * @param {Array} prompts
 * @param {Object} codebookVariables
 * @returns {Array}
 * @private
 */

type MaybePrompt = Prompt & {
  bucketSortOrder?: {
    property: string;
    direction?: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
  }[];
  binSortOrder?: {
    property: string;
    direction?: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
  }[];
};

const processSortRules = (
  prompts: MaybePrompt[] = [],
  codebookVariables: EntityDefinition['variables'],
) => {
  const sortProperties = ['bucketSortOrder', 'binSortOrder'] as const;

  const ruleProcessor = processProtocolSortRule(codebookVariables) as (rule: {
    property: string;
    direction?: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
  }) => {
    property: string;
    direction?: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
  } & Record<string, unknown>;

  return prompts.map((prompt) => {
    const sortOptions = {} as {
      bucketSortOrder?: {
        property: string;
        direction?: 'asc' | 'desc';
        type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
      }[];
      binSortOrder?: {
        property: string;
        direction?: 'asc' | 'desc';
        type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
      }[];
    };

    sortProperties.forEach((property) => {
      if (property in prompt) {
        const sortRules = prompt[property] as unknown as {
          property: string;
          direction?: 'asc' | 'desc';
          type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
        }[]; // todo: replace with sortOrder schema from protocol-validation
        sortOptions[property] = sortRules.map(ruleProcessor);
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
export const usePrompts = <T extends object = MaybePrompt>() => {
  const dispatch = useDispatch();
  const setPrompt = useCallback(
    (promptIndex: number) => dispatch(updatePrompt(promptIndex)),
    [dispatch],
  );

  const codebookVariables = useSelector(getAllVariableUUIDsByEntity);
  const prompts = useSelector(getPrompts) as (MaybePrompt & T)[];

  const processedPrompts = processSortRules(prompts, codebookVariables) as T[];

  const promptIndex = useSelector(getPromptIndex);
  const isFirstPrompt = prompts.length === 0;
  const isLastPrompt = promptIndex === prompts.length - 1;

  const promptForward = () => {
    updatePrompt((promptIndex + 1) % processedPrompts.length);
  };

  const promptBackward = () => {
    updatePrompt(
      (promptIndex - 1 + processedPrompts.length) % processedPrompts.length,
    );
  };

  const currentPrompt = () => {
    return processedPrompts[promptIndex] ?? ({ id: null } as MaybePrompt & T);
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

const withPrompt = <P extends object>(
  WrappedComponent: React.ComponentType<P & ReturnType<typeof usePrompts>>,
) => {
  const WithPrompt = (props: P) => {
    const prompts = usePrompts();

    return <WrappedComponent {...prompts} {...props} />;
  };

  return WithPrompt;
};

export default withPrompt;
