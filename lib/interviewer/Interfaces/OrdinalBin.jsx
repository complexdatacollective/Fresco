import { entityAttributesProperty } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import PropTypes from 'prop-types';
import { usePrompts } from '../behaviours/withPrompt';
import MultiNodeBucket from '../components/MultiNodeBucket';
import Prompts from '../components/Prompts';
import usePropSelector from '../hooks/usePropSelector';
import { getPromptVariable } from '../selectors/prop';
import { getNetworkNodesForType } from '../selectors/session';
import OrdinalBins from '../containers/OrdinalBins';

/**
 * OrdinalBin Interface
 */
const OrdinalBin = (props) => {
  const { stage } = props;

  const { prompt } = usePrompts();
  const stageNodes = usePropSelector(getNetworkNodesForType, props);
  const activePromptVariable = usePropSelector(getPromptVariable, {
    ...props,
    prompt,
  });

  const nodesForPrompt = stageNodes.filter((node) =>
    isNil(node[entityAttributesProperty][activePromptVariable]),
  );

  return (
    <div className="ordinal-bin-interface">
      <div className="ordinal-bin-interface__prompt">
        <Prompts />
      </div>
      <div className="ordinal-bin-interface__bucket">
        <MultiNodeBucket
          nodes={nodesForPrompt}
          listId={`${stage.id}_${prompt?.id ?? 'unknown'}_NODE_BUCKET`}
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
};

export default OrdinalBin;
