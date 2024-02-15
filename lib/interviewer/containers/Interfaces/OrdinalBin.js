import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { entityAttributesProperty } from '@codaco/shared-consts';
import Prompts from '../../components/Prompts';
import OrdinalBins from '../OrdinalBins';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import { getNetworkNodesForType } from '../../selectors/interface';
import { getPromptVariable } from '../../selectors/prop';
import { usePrompts } from '../../behaviours/withPrompt';

/**
 * OrdinalBin Interface
 */
const OrdinalBin = ({ nodesForPrompt, stage }) => {
  const { currentPrompt: prompt } = usePrompts();

  return (
    <div className="ordinal-bin-interface">
      <div className="ordinal-bin-interface__prompt">
        <Prompts />
      </div>
      <div className="ordinal-bin-interface__bucket">
        <MultiNodeBucket
          nodes={nodesForPrompt}
          listId={`${stage.id}_${prompt?.id}_NODE_BUCKET`}
          itemType="EXISTING_NODE"
          sortOrder={prompt?.bucketSortOrder}
        />
      </div>
      <div className="ordinal-bin-interface__bins">
        <OrdinalBins stage={stage} prompt={prompt} />
      </div>
    </div>
  );
};

OrdinalBin.propTypes = {
  stage: PropTypes.object.isRequired,
  prompt: PropTypes.object.isRequired,
  nodesForPrompt: PropTypes.array.isRequired,
};

function makeMapStateToProps() {
  return (state, props) => {
    const stageNodes = getNetworkNodesForType(state, props);
    const activePromptVariable = getPromptVariable(state, props);

    return {
      nodesForPrompt: stageNodes.filter((node) =>
        isNil(node[entityAttributesProperty][activePromptVariable]),
      ),
    };
  };
}

export default compose(connect(makeMapStateToProps))(OrdinalBin);
