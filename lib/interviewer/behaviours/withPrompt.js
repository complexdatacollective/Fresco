import { useDispatch, useSelector } from 'react-redux';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import { getAllVariableUUIDsByEntity } from '../selectors/protocol';
import {
  getIsFirstPrompt,
  getIsLastPrompt,
  getPromptIndex,
  getPrompts,
} from '../selectors/session';
import { processProtocolSortRule } from '../utils/createSorter';
import { get } from '../utils/lodash-replacements';

/**
 * Convert sort rules to new format. See `processProtocolSortRule` for details.
 * @param {Array} prompts
 * @param {Object} codebookVariables
 * @returns {Array}
 * @private
 */
const processSortRules = (prompts = [], codebookVariables) => {
  const sortProperties = ['bucketSortOrder', 'binSortOrder'];

  return prompts.map((prompt) => {
    const sortOptions = {};
    sortProperties.forEach((property) => {
      const sortRules = get(prompt, property, []);
      sortOptions[property] = sortRules.map(
        processProtocolSortRule(codebookVariables),
      );
    });
    return {
      ...prompt,
      ...sortOptions,
    };
  });
};

export const usePrompts = () => {
  const dispatch = useDispatch();
  const updatePrompt = (promptIndex) =>
    dispatch(sessionActions.updatePrompt(promptIndex));

  const codebookVariables = useSelector(getAllVariableUUIDsByEntity);
  const prompts = useSelector(getPrompts);

  const processedPrompts = processSortRules(prompts, codebookVariables);

  const isFirstPrompt = useSelector(getIsFirstPrompt);
  const isLastPrompt = useSelector(getIsLastPrompt);
  const promptIndex = useSelector(getPromptIndex);

  const promptForward = () => {
    updatePrompt((promptIndex + 1) % processedPrompts.length);
  };

  const promptBackward = () => {
    updatePrompt(
      (promptIndex - 1 + processedPrompts.length) % processedPrompts.length,
    );
  };

  const currentPrompt = () => {
    return processedPrompts[promptIndex] ?? { id: null };
  };

  return {
    promptIndex,
    prompt: currentPrompt(),
    prompts: processedPrompts,
    promptForward,
    promptBackward,
    isLastPrompt,
    isFirstPrompt,
    updatePrompt,
  };
};

const withPrompt = (WrappedComponent) => {
  const WithPrompt = (props) => {
    const prompts = usePrompts();

    return (
      <WrappedComponent
        {...prompts}
        {...props}
      />
    );
  };

  return WithPrompt;
};



export default withPrompt;
