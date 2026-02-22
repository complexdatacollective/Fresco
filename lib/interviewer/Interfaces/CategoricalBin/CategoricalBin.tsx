import { LayoutGroup } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { type StageProps } from '~/lib/interviewer/types';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
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

const isSpecialValue = (value: number | string | null) => {
  if (value === null) return true;
  if (typeof value === 'number' && value < 0) return true;
  return false;
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
  const { containerRef, flexBasis, ready } = useCircleLayout({
    count: circleCount,
  });

  const expandedBin = hasExpanded ? bins[expandedBinIndex] : undefined;

  return (
    <div className="interface flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <Prompts />
      </div>
      <div onClick={handleCollapseAll}>
        <MultiNodeBucket
          nodes={uncategorisedNodes}
          listId={`${stage.id}_${prompt?.id ?? 'unknown'}_CAT_BUCKET`}
          sortOrder={prompt?.bucketSortOrder}
        />
      </div>
      <div
        className="flex min-h-0 w-full flex-1 gap-4"
        onClick={handleCollapseAll}
      >
        {prompt && activePromptVariable && (
          <LayoutGroup>
            {hasExpanded && expandedBin && (
              <CategoricalBinItem
                key={expandedBinIndex}
                bin={expandedBin}
                index={expandedBinIndex}
                activePromptVariable={activePromptVariable}
                promptOtherVariable={promptOtherVariable}
                stageId={stage.id}
                promptId={prompt.id}
                sortOrder={prompt.binSortOrder}
                isExpanded={true}
                onToggleExpand={handleToggleExpand}
                catColor={getCatColor(expandedBinIndex, expandedBin.value)}
                layoutStyle={{ width: '50%', height: '100%' }}
              />
            )}
            <div
              ref={containerRef}
              className="flex min-h-0 flex-1 flex-wrap content-center items-center justify-center gap-4"
            >
              {ready &&
                bins.map((bin, index) => {
                  if (index === expandedBinIndex) return null;
                  return (
                    <CategoricalBinItem
                      key={index}
                      bin={bin}
                      index={index}
                      activePromptVariable={activePromptVariable}
                      promptOtherVariable={promptOtherVariable}
                      stageId={stage.id}
                      promptId={prompt.id}
                      sortOrder={prompt.binSortOrder}
                      isExpanded={false}
                      onToggleExpand={handleToggleExpand}
                      catColor={getCatColor(index, bin.value)}
                      layoutStyle={{
                        flexBasis: `${flexBasis}px`,
                        aspectRatio: '1 / 1',
                      }}
                    />
                  );
                })}
            </div>
          </LayoutGroup>
        )}
      </div>
    </div>
  );
};

export default CategoricalBin;
