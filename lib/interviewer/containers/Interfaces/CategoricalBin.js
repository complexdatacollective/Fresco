import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
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
const CategoricalBin = ({
  uncategorizedNodes,
  expandedBinIndex,
  handleExpandBin,
  stage,
}) => {
  const { prompt, } = usePrompts();
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
  uncategorizedNodes: PropTypes.array.isRequired,
  expandedBinIndex: PropTypes.number,
  handleExpandBin: PropTypes.func.isRequired,
};

function makeMapStateToProps() {
  return function mapStateToProps(state, props) {
    const stageNodes = getNetworkNodesForType(state, props);
    const activePromptVariable = getPromptVariable(state, props);
    const [promptOtherVariable] = getPromptOtherVariable(state, props);

    const matchNoCategory = (node) =>
      !node[entityAttributesProperty][activePromptVariable] &&
      !node[entityAttributesProperty][promptOtherVariable];

    return {
      activePromptVariable,
      uncategorizedNodes: stageNodes.filter(matchNoCategory),
    };
  };
}

export { CategoricalBin as UnconnectedCategoricalBin };

export default compose(
  connect(makeMapStateToProps),
  categoricalBinStateHandler,
)(CategoricalBin);
