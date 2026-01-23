import { type Prompt, type Stage } from '@codaco/protocol-validation';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import { useSelector } from 'react-redux';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { usePrompts } from '../../behaviours/withPrompt';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import Prompts from '../../components/Prompts';
import { type StageProps } from '../../containers/Stage';
import { getPromptVariable } from '../../selectors/prop';
import { getNetworkNodesForType } from '../../selectors/session';
import { type ProcessedSortRule } from '../../utils/createSorter';
import OrdinalBins from './components/OrdinalBins';

type OrdinalBinStageProps = StageProps & {
  stage: Extract<Stage, { type: 'OrdinalBin' }>;
};

type OrdinalBinPrompt = Prompt & {
  bucketSortOrder?: ProcessedSortRule[];
  binSortOrder?: ProcessedSortRule[];
  color?: string;
};

/**
 * OrdinalBin Interface
 *
 * An interface for assigning ordinal values to nodes. Nodes are dragged from
 * a bucket into bins representing ordinal values (e.g., 1-5 scale).
 */
const OrdinalBin = (props: OrdinalBinStageProps) => {
  const { stage } = props;

  const { prompt } = usePrompts<OrdinalBinPrompt>();

  const stageNodes = useSelector(getNetworkNodesForType);
  const activePromptVariable = useSelector(getPromptVariable);

  const nodesForPrompt = stageNodes.filter((node) =>
    isNil(node[entityAttributesProperty][activePromptVariable!]),
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
          sortOrder={prompt?.bucketSortOrder}
        />
      </div>
      <div className="ordinal-bin-interface__bins">
        <OrdinalBins stage={stage} prompt={prompt ?? null} />
      </div>
    </div>
  );
};

export default withNoSSRWrapper(OrdinalBin);
