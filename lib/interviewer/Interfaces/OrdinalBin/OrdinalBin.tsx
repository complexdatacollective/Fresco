import { type Stage } from '@codaco/protocol-validation';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type StageProps } from '~/lib/interviewer/types';
import NodeDrawer from '../../components/NodeDrawer';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { getCurrentStageId } from '../../selectors/session';
import OrdinalBinItem from './components/OrdinalBinItem';
import { useOrdinalBins } from './useOrdinalBins';

type OrdinalBinStageProps = StageProps<'OrdinalBin'>;

type OrdinalBinPrompts = Extract<
  Stage,
  { type: 'OrdinalBin' }
>['prompts'][number];

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

const OrdinalBin = (_props: OrdinalBinStageProps) => {
  const {
    prompt,
    prompt: { variable: activePromptVariable },
  } = usePrompts<OrdinalBinPrompts>();

  const stageId = useSelector(getCurrentStageId);
  const { bins, unplacedNodes } = useOrdinalBins();

  const { updateReady } = useReadyForNextStage();

  useEffect(() => {
    updateReady(unplacedNodes.length === 0);
  }, [unplacedNodes.length, updateReady]);

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
              className="grid h-full auto-cols-fr grid-flow-col grid-rows-[auto_1fr] gap-x-2 portrait:grid-flow-row portrait:auto-rows-fr portrait:grid-cols-[auto_1fr] portrait:grid-rows-none portrait:gap-x-0 portrait:gap-y-2"
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
                  stageId={stageId}
                  promptId={prompt.id}
                  sortOrder={prompt.binSortOrder}
                  totalBins={bins.length}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <NodeDrawer nodes={unplacedNodes} itemType="NODE" />
    </div>
  );
};

export default OrdinalBin;
