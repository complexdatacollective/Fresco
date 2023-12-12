import React, { Component, useEffect } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import { getAllVariableUUIDsByEntity, getProtocolStages } from '../selectors/protocol';
import { get } from '../utils/lodash-replacements';
import { processProtocolSortRule } from '../utils/createSorter';
import { getIsFirstPrompt, getIsLastPrompt, getPromptIndex, getPrompts } from '../selectors/session';

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
      sortOptions[property] = sortRules.map(processProtocolSortRule(codebookVariables));
    });
    return {
      ...prompt,
      ...sortOptions,
    };
  });
};

const withPrompt = (WrappedComponent) => {
  const WithPrompt = (props) => {
    const dispatch = useDispatch();
    const updatePrompt = (promptIndex) => dispatch(sessionActions.updatePrompt(promptIndex));

    const codebookVariables = useSelector(getAllVariableUUIDsByEntity);
    const prompts = useSelector(getPrompts);
    const { ...rest } = props;

    const processedPrompts = processSortRules(prompts, codebookVariables);

    const isFirstPrompt = useSelector(getIsFirstPrompt);
    const isLastPrompt = useSelector(getIsLastPrompt);
    const promptIndex = useSelector(getPromptIndex);

    const promptForward = () => {
      updatePrompt((promptIndex + 1) % processedPrompts.length);
    };

    const promptBackward = () => {
      updatePrompt((promptIndex - 1 + processedPrompts.length) % processedPrompts.length);
    };

    const prompt = () => {
      return get(processedPrompts, promptIndex);
    };

    return (
      <WrappedComponent
        prompt={prompt()}
        promptForward={promptForward}
        promptBackward={promptBackward}
        isLastPrompt={isLastPrompt}
        isFirstPrompt={isFirstPrompt}
        {...rest}
      />
    );
  };

  WithPrompt.propTypes = {
    stage: PropTypes.object.isRequired,
    promptIndex: PropTypes.number,
    updatePrompt: PropTypes.func.isRequired,
    promptId: PropTypes.number,
  };

  return WithPrompt;
};

export const usePrompts = () => {
  const dispatch = useDispatch();
  const updatePrompt = (promptIndex) => dispatch(sessionActions.updatePrompt(promptIndex));

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
    updatePrompt((promptIndex - 1 + processedPrompts.length) % processedPrompts.length);
  };

  const currentPrompt = () => {
    return processedPrompts[promptIndex] ?? null;
  };

  return {
    promptIndex,
    currentPrompt: currentPrompt(),
    prompts,
    promptForward,
    promptBackward,
    isLastPrompt,
    isFirstPrompt,
  };
}


export default withPrompt;