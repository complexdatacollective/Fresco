import { type Prompt } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { useDropTarget } from '~/lib/dnd';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { cx } from '~/utils/cva';
import { type StageProps } from '~/lib/interviewer/types';
import MultiNodeBucket from '../../components/MultiNodeBucket';
import NodeList from '../../components/NodeList';
import Overlay from '../../components/Overlay';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import { updateNode } from '../../ducks/modules/session';
import { useAppDispatch } from '../../store';
import createSorter, { type ProcessedSortRule } from '../../utils/createSorter';
import CategoricalBinItem from './components/CategoricalBinItem';
import OtherVariableForm from './components/OtherVariableForm';
import {
  type CategoricalBin as CategoricalBinType,
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

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
};

const panelEnter = { opacity: 0, x: -20 };
const panelVisible = { opacity: 1, x: 0 };
const panelExit = { opacity: 0, x: -20 };

const circleItemVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

// --- ExpandedBinPanel ---

type ExpandedBinPanelProps = {
  bin: CategoricalBinType;
  binIndex: number;
  activePromptVariable: string;
  promptOtherVariable: string | undefined;
  stageId: string;
  promptId: string;
  sortOrder: ProcessedSortRule[];
  catColor: string | null;
  onCollapse: () => void;
};

const ExpandedBinPanel = ({
  bin,
  binIndex,
  activePromptVariable,
  promptOtherVariable,
  stageId,
  promptId,
  sortOrder,
  catColor,
  onCollapse,
}: ExpandedBinPanelProps) => {
  const dispatch = useAppDispatch();
  const { prompt } = usePrompts<Prompt & { sortOrder?: ProcessedSortRule[] }>();

  const isOtherVariable = !!bin.otherVariable;
  const [showOther, setShowOther] = useState<NcNode | null>(null);

  const setNodeCategory = useCallback(
    (node: NcNode, category: string | number | null) => {
      const variable = bin.otherVariable ?? activePromptVariable;
      const resetVariable = bin.otherVariable
        ? activePromptVariable
        : promptOtherVariable;

      const value =
        bin.otherVariable || category === null
          ? category
          : ([category] as (string | number | boolean)[]);

      if (getEntityAttributes(node)[variable] === value) {
        return;
      }

      void dispatch(
        updateNode({
          nodeId: node[entityPrimaryKeyProperty],
          newAttributeData: {
            [variable]: value,
            ...(resetVariable ? { [resetVariable]: null } : {}),
          },
        }),
      );
    },
    [bin.otherVariable, activePromptVariable, promptOtherVariable, dispatch],
  );

  const handleDrop = useCallback(
    (metadata?: Record<string, unknown>) => {
      const node = metadata as NcNode | undefined;
      if (!node) return;

      if (isOtherVariable) {
        setShowOther(node);
        return;
      }

      setNodeCategory(node, bin.value);
    },
    [isOtherVariable, setNodeCategory, bin.value],
  );

  const handleClickItem = useCallback(
    (node: NcNode) => {
      if (!isOtherVariable) return;
      setShowOther(node);
    },
    [isOtherVariable],
  );

  const handleSubmitOtherVariableForm = ({
    otherVariable: value,
  }: {
    otherVariable: string;
  }) => {
    setNodeCategory(showOther!, value);
    setShowOther(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCollapse();
    }
  };

  const listSortOrder = prompt?.sortOrder ?? sortOrder;
  const sorter = useMemo(
    () => createSorter<NcNode>(listSortOrder),
    [listSortOrder],
  );
  const sortedNodes = sorter(bin.nodes);

  const listId = `CATBIN_NODE_LIST_${stageId}_${promptId}_${binIndex}`;

  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id: `CATBIN_EXPANDED_${stageId}_${promptId}_${binIndex}`,
    accepts: ['NODE'],
    announcedName: `Category: ${bin.label}`,
    onDrop: handleDrop,
  });

  const missingValue =
    bin.value === null || (typeof bin.value === 'number' && bin.value < 0);

  const colorStyle = catColor
    ? ({ '--cat-color': catColor } as React.CSSProperties)
    : {};

  const panelClasses = cx(
    'flex h-full flex-col overflow-hidden rounded-2xl border-4 transition-colors',
    catColor && 'border-(--cat-color)',
    !catColor && 'border-outline',
    isDragging && willAccept && 'ring-2 ring-(--cat-color) ring-offset-2',
    isOver &&
      willAccept &&
      'shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
  );

  const headerClasses = cx(
    'flex shrink-0 cursor-pointer items-center gap-3 px-4 py-3',
    catColor && !missingValue && 'bg-[oklch(from_var(--cat-color)_l_c_h/0.15)]',
    catColor &&
      missingValue &&
      'bg-[oklch(from_var(--cat-color)_calc(l*0.5)_calc(c*0.4)_h/0.15)]',
    !catColor && 'bg-surface-1',
  );

  return (
    <>
      <motion.div
        key={binIndex}
        initial={panelEnter}
        animate={panelVisible}
        exit={panelExit}
        transition={springTransition}
        className="size-full p-4"
      >
        <div className={panelClasses} style={colorStyle}>
          <div
            className={headerClasses}
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={true}
            aria-label={`Category ${bin.label}, ${bin.nodes.length} items, expanded`}
          >
            <h3 className="text-lg font-semibold">
              <RenderMarkdown>{bin.label}</RenderMarkdown>
            </h3>
            <span className="ml-auto text-sm opacity-60">
              {bin.nodes.length}
            </span>
          </div>
          <div {...dropProps} className="min-h-0 flex-1 overflow-hidden p-2">
            <ScrollArea className="size-full">
              <NodeList
                id={listId}
                items={sortedNodes}
                nodeSize="sm"
                onItemClick={handleClickItem}
              />
            </ScrollArea>
          </div>
        </div>
      </motion.div>

      {isOtherVariable && (
        <Overlay
          show={showOther !== null}
          onClose={() => setShowOther(null)}
          title={bin.otherVariablePrompt ?? 'Other'}
        >
          {showOther && (
            <OtherVariableForm
              node={showOther}
              prompt={bin.otherVariablePrompt!}
              onSubmit={handleSubmitOtherVariableForm}
              onCancel={() => setShowOther(null)}
              initialValues={{
                otherVariable: (getEntityAttributes(showOther)[
                  bin.otherVariable!
                ] ?? '') as string,
              }}
            />
          )}
        </Overlay>
      )}
    </>
  );
};

// --- CategoricalBin ---

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
  const expandedBin = hasExpanded ? bins[expandedBinIndex] : null;

  // Circle count excludes the expanded bin
  const visibleCircleCount = hasExpanded ? bins.length - 1 : bins.length;

  const { containerRef, circleSize } = useCircleLayout({
    count: visibleCircleCount,
  });

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
      <div className="flex min-h-0 w-full flex-1">
        {/* LEFT: expanded panel — always in DOM, width animates */}
        <motion.div
          animate={{ width: hasExpanded ? '50%' : 0 }}
          transition={springTransition}
          className="shrink-0 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {expandedBin &&
              expandedBinIndex !== null &&
              activePromptVariable && (
                <ExpandedBinPanel
                  key={expandedBinIndex}
                  bin={expandedBin}
                  binIndex={expandedBinIndex}
                  activePromptVariable={activePromptVariable}
                  promptOtherVariable={promptOtherVariable}
                  stageId={stage.id}
                  promptId={prompt?.id ?? 'unknown'}
                  sortOrder={prompt?.binSortOrder ?? []}
                  catColor={getCatColor(expandedBinIndex, expandedBin.value)}
                  onCollapse={handleCollapseAll}
                />
              )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT: circles container with ResizeObserver sizing */}
        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 flex-wrap content-center items-center justify-center gap-6 p-6"
          onClick={handleCollapseAll}
        >
          <AnimatePresence>
            {prompt &&
              activePromptVariable &&
              circleSize > 0 &&
              bins.map((bin, index) => {
                if (index === expandedBinIndex) return null;
                return (
                  <motion.div
                    key={index}
                    layout
                    variants={circleItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={springTransition}
                    style={{
                      width: circleSize,
                      height: circleSize,
                    }}
                  >
                    <CategoricalBinItem
                      bin={bin}
                      index={index}
                      activePromptVariable={activePromptVariable}
                      promptOtherVariable={promptOtherVariable}
                      stageId={stage.id}
                      promptId={prompt.id}
                      onToggleExpand={handleToggleExpand}
                      catColor={getCatColor(index, bin.value)}
                    />
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CategoricalBin;
