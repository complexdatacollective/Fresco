import { type Prompt, type Stage } from '@codaco/protocol-validation';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import { useSelector } from 'react-redux';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { usePrompts } from '../../behaviours/withPrompt';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import Prompts from '../../components/Prompts';
import { type StageProps } from '../../components/Stage';
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
    <div className="interface flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <Prompts />
      </div>
      <div className="flex-1 overflow-hidden">
        <MultiNodeBucket
          nodes={nodesForPrompt}
          listId={`${stage.id}_${prompt?.id ?? 'unknown'}_NODE_BUCKET`}
          sortOrder={prompt?.bucketSortOrder}
        />
      </div>
      <div className="flex h-64 shrink-0 gap-2 px-4 pb-4">
        <OrdinalBins stage={stage} prompt={prompt ?? null} />
      </div>
    </div>
  );
};

export default withNoSSRWrapper(OrdinalBin);
