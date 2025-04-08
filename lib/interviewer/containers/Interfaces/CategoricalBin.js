import React from 'react';
import { compose } from '@reduxjs/toolkit';
import { withStateHandlers } from 'recompose';
import PropTypes from 'prop-types';
import { entityAttributesProperty } from '@codaco/shared-consts';
import Prompts from '../../components/Prompts';
import CategoricalList from '../CategoricalList';
import { getNetworkNodesForType } from '../../selectors/interface';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import {
  getPromptVariable,
  getPromptOtherVariable,
} from '../../selectors/prop';
import { usePrompts } from '../../behaviours/withPrompt';
import usePropSelector from '../../hooks/usePropSelector';

const categoricalBinStateHandler = withStateHandlers(
  {
    expandedBinIndex: null,
  },
  {
    handleExpandBin:
      () =>
      (expandedBinIndex = null) => ({ expandedBinIndex }),
  },
);

/**
 * CategoricalBin Interface
 */
const CategoricalBin = (props) => {
  const { expandedBinIndex, handleExpandBin, stage } = props;
  const { prompt } = usePrompts();

  const stageNodes = usePropSelector(getNetworkNodesForType, props);
  const activePromptVariable = usePropSelector(getPromptVariable, {
    ...props,
    prompt,
  });
  const [promptOtherVariable] = usePropSelector(getPromptOtherVariable, {
    ...props,
    prompt,
  });

  const uncategorizedNodes = stageNodes.filter(
    (node) =>
      !node[entityAttributesProperty][activePromptVariable] &&
      !node[entityAttributesProperty][promptOtherVariable],
  );

  return (
    <div className="categorical-bin-interface">
      <div className="categorical-bin-interface__prompt">
        <Prompts />
      </div>
      <div
        className="categorical-bin-interface__bucket"
        onClick={() => handleExpandBin()}
      >
        <MultiNodeBucket
          nodes={uncategorizedNodes}
          listId={`${stage.id}_${prompt?.id}_CAT_BUCKET`}
          sortOrder={prompt?.bucketSortOrder}
        />
      </div>
      <CategoricalList
        key={prompt?.id}
        stage={stage}
        prompt={prompt}
        expandedBinIndex={expandedBinIndex}
        onExpandBin={handleExpandBin}
      />
    </div>
  );
};

CategoricalBin.propTypes = {
  stage: PropTypes.object.isRequired,
  expandedBinIndex: PropTypes.number,
  handleExpandBin: PropTypes.func.isRequired,
};

export default compose(categoricalBinStateHandler)(CategoricalBin);
