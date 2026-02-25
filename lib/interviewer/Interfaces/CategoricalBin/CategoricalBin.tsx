import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { type StageProps } from '~/lib/interviewer/types';
import NodeDrawer from '../../components/NodeDrawer';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import useSortedNodeList from '../../hooks/useSortedNodeList';
import CategoricalBinItem from './components/CategoricalBinItem';
import {
  type CategoricalBinPrompt,
  useCategoricalBins,
} from './useCategoricalBins';
import { useCircleLayout } from './useCircleLayout';

type CategoricalBinStageProps = StageProps<'CategoricalBin'>;

const CAT_COLOR_VARS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
  'var(--cat-9)',
  'var(--cat-10)',
];

// Determine if this is an 'other' or missing category, which needs to have
// different visual treatment.
const isSpecialValue = (value: number | string | null) => {
  if (value === null) return true;
  if (typeof value === 'number' && value < 0) return true;
  return false;
};

const binsContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      when: 'beforeChildren' as const,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const getCatColor = (index: number, value: number | string | null) => {
  if (index < 0) return null;
  const colorVar = CAT_COLOR_VARS[index % CAT_COLOR_VARS.length]!;

  if (isSpecialValue(value)) {
    return `oklch(from ${colorVar} calc(l*0.5) calc(c*0.4) h)`;
  }

  return colorVar;
};

const CategoricalBin = (props: CategoricalBinStageProps) => {
  const { stage } = props;

  const [expandedBinIndex, setExpandedBinIndex] = useState<number | null>(null);

  const { prompt } = usePrompts<CategoricalBinPrompt>();

  const {
    bins,
    activePromptVariable,
    promptOtherVariable,
    uncategorisedNodes,
  } = useCategoricalBins();

  const sortedUncategorisedNodes = useSortedNodeList(
    uncategorisedNodes,
    prompt?.bucketSortOrder,
  );

  const { updateReady } = useReadyForNextStage();

  useEffect(() => {
    updateReady(uncategorisedNodes.length === 0);
  }, [uncategorisedNodes.length, updateReady]);

  // Reset expanded bin when prompt changes
  useEffect(() => {
    setExpandedBinIndex(null);
  }, [prompt?.id]);

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedBinIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedBinIndex(null);
  }, []);

  const hasExpanded = expandedBinIndex !== null;

  const circleCount = hasExpanded ? bins.length - 1 : bins.length;
  const { containerRef, flexBasis } = useCircleLayout({
    count: circleCount,
  });

  return (
    <div
      className="interface relative flex h-full flex-col overflow-hidden"
      onClick={handleCollapseAll}
    >
      <div className="shrink-0">
        <Prompts />
      </div>
      {prompt && activePromptVariable && (
        <div className="catbin-outer min-h-0 w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={prompt.id}
              ref={containerRef}
              className="catbin-circles flex size-full flex-wrap content-center items-center justify-center gap-4 data-expanded:content-start"
              data-expanded={hasExpanded || undefined}
              variants={binsContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {bins.map((bin, index) => (
                <CategoricalBinItem
                  key={index}
                  bin={bin}
                  index={index}
                  activePromptVariable={activePromptVariable}
                  promptOtherVariable={promptOtherVariable}
                  stageId={stage.id}
                  promptId={prompt.id}
                  sortOrder={prompt.binSortOrder}
                  isExpanded={index === expandedBinIndex}
                  onToggleExpand={handleToggleExpand}
                  catColor={getCatColor(index, bin.value)}
                  flexBasis={flexBasis}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      <NodeDrawer
        nodes={sortedUncategorisedNodes}
        itemType="NODE"
        expanded={!hasExpanded}
      />
    </div>
  );
};

export default CategoricalBin;
