import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { entityAttributesProperty } from '@codaco/shared-consts';
import Prompts from '../../components/Prompts';
import withPrompt from '../../behaviours/withPrompt';
import OrdinalBins from '../OrdinalBins';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import { getNetworkNodesForType } from '../../selectors/interface';
import { getPromptVariable } from '../../selectors/prop';

/**
  * OrdinalBin Interface
  */
const OrdinalBin = ({
  prompt,
  nodesForPrompt,
  stage,
}) => {
  const {
    prompts,
  } = stage;

  return (
    <div className="ordinal-bin-interface">
      <div className="ordinal-bin-interface__prompt">
        <Prompts
          prompts={prompts}
          currentPrompt={prompt.id}
        />
      </div>
      <div className="ordinal-bin-interface__bucket">
        <MultiNodeBucket
          nodes={nodesForPrompt}
          listId={`${stage.id}_${prompt.id}_NODE_BUCKET`}
          itemType="EXISTING_NODE"
          sortOrder={prompt.bucketSortOrder}
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
      nodesForPrompt: stageNodes.filter(
        (node) => isNil(node[entityAttributesProperty][activePromptVariable]),
      ),
    };
  };
}

export default compose(
  withPrompt,
  connect(makeMapStateToProps),
)(OrdinalBin);
