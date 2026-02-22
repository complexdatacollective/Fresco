import { type Prompt } from '@codaco/protocol-validation';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { useSelector } from 'react-redux';
import { type StageProps } from '~/lib/interviewer/types';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import { getNetworkNodesForType } from '../../selectors/session';
import { type ProcessedSortRule } from '../../utils/createSorter';
import OrdinalBinItem from './components/OrdinalBinItem';
import { useOrdinalBins } from './useOrdinalBins';

type OrdinalBinStageProps = StageProps<'OrdinalBin'>;

const binsContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      when: 'beforeChildren' as const,
    },
  },
  exit: { opacity: 0 },
};

// TODO: This type shouldn't be needed. The prompt type should be defined by the protocol and
// validated as such. There is a problem with the protocol validation type for this
// stage's prompt.
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

  const { bins, activePromptVariable } = useOrdinalBins();

  const nodesForPrompt = stageNodes.filter((node) =>
    isNil(node[entityAttributesProperty][activePromptVariable!]),
  );

  return (
    <div className="interface flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <Prompts />
      </div>
      <MultiNodeBucket
        nodes={nodesForPrompt}
        listId={`${stage.id}_${prompt?.id ?? 'unknown'}_NODE_BUCKET`}
        sortOrder={prompt?.bucketSortOrder}
      />
      <div className="min-h-0 w-full flex-1">
        <AnimatePresence mode="wait">
          {prompt && activePromptVariable && (
            <motion.div
              key={prompt.id}
              className="grid h-full auto-cols-fr grid-flow-col grid-rows-[auto_1fr] gap-x-2"
              variants={binsContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {bins.map((bin, index) => (
                <OrdinalBinItem
                  key={index}
                  bin={bin}
                  index={index}
                  activePromptVariable={activePromptVariable}
                  stageId={stage.id}
                  promptId={prompt.id}
                  sortOrder={prompt.binSortOrder}
                  totalBins={bins.length}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrdinalBin;
