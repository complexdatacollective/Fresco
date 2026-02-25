import { entityAttributesProperty } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type StageProps } from '~/lib/interviewer/types';
import NodeDrawer from '../../components/NodeDrawer';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import useSortedNodeList from '../../hooks/useSortedNodeList';
import { getNetworkNodesForType } from '../../selectors/session';
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

/**
 * OrdinalBin Interface
 *
 * An interface for assigning ordinal values to nodes. Nodes are dragged from
 * a bucket into bins representing ordinal values (e.g., 1-5 scale).
 */
const OrdinalBin = (props: OrdinalBinStageProps) => {
  const { stage } = props;

  const { prompt } = usePrompts<(typeof stage.prompts)[number]>();

  const stageNodes = useSelector(getNetworkNodesForType);

  const { bins, activePromptVariable } = useOrdinalBins();

  const nodesForPrompt = stageNodes.filter((node) =>
    isNil(node[entityAttributesProperty][activePromptVariable!]),
  );
  const sortedUnplacedNodes = useSortedNodeList(
    nodesForPrompt,
    prompt?.bucketSortOrder,
  );

  const { updateReady } = useReadyForNextStage();

  useEffect(() => {
    updateReady(nodesForPrompt.length === 0);
  }, [nodesForPrompt.length, updateReady]);

  return (
    <div className="interface relative flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <Prompts />
      </div>
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
      <NodeDrawer nodes={sortedUnplacedNodes} itemType="NODE" />
    </div>
  );
};

export default OrdinalBin;
