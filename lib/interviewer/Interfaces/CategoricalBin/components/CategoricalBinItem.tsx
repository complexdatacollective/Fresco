import { type Prompt } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { animate, AnimatePresence, motion, useMotionValue } from 'motion/react';
import { memo, useEffect, useMemo, useState } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { useDropTarget } from '~/lib/dnd';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { cx } from '~/utils/cva';
import NodeList from '../../../components/NodeList';
import { usePrompts } from '../../../components/Prompts/usePrompts';
import { updateNode } from '../../../ducks/modules/session';
import { useAppDispatch } from '../../../store';
import createSorter, {
  type ProcessedSortRule,
} from '../../../utils/createSorter';
import { type CategoricalBin } from '../useCategoricalBins';
import BinSummary from './BinSummary';
import OtherVariableForm from './OtherVariableForm';

type CategoricalBinItemProps = {
  bin: CategoricalBin;
  index: number;
  activePromptVariable: string;
  promptOtherVariable: string | undefined;
  stageId: string;
  promptId: string;
  sortOrder?: ProcessedSortRule[];
  isExpanded: boolean;
  onToggleExpand: (index: number) => void;
  catColor: string | null;
  flexBasis: number;
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
};

const binItemVariants = {
  initial: { opacity: 0, scale: 0.4 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.4, transition: { duration: 0.15 } },
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { when: 'beforeChildren' } },
  exit: { opacity: 0 },
};

const CategoricalBinItem = memo((props: CategoricalBinItemProps) => {
  const {
    bin,
    index,
    activePromptVariable,
    promptOtherVariable,
    stageId,
    promptId,
    sortOrder = [],
    isExpanded,
    onToggleExpand,
    catColor,
    flexBasis,
  } = props;

  const dispatch = useAppDispatch();
  const { prompt } = usePrompts<Prompt & { sortOrder?: ProcessedSortRule[] }>();

  const isOtherVariable = !!bin.otherVariable;
  const [showOther, setShowOther] = useState<NcNode | null>(null);

  // Animate borderRadius independently of the layout FLIP.
  // layout only does scale correction on borderRadius (non-shared),
  // it doesn't interpolate between old/new values. Using flexBasis/2
  // instead of 9999 keeps the percentage-based correction smooth.
  const circleBorderRadius = flexBasis > 0 ? flexBasis / 2 : 9999;
  const borderRadius = useMotionValue(isExpanded ? 16 : circleBorderRadius);

  useEffect(() => {
    const controls = animate(
      borderRadius,
      isExpanded ? 16 : circleBorderRadius,
      springTransition,
    );
    return () => controls.stop();
  }, [isExpanded, circleBorderRadius, borderRadius]);

  const setNodeCategory = (node: NcNode, category: string | number | null) => {
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
  };

  const handleDrop = (metadata?: Record<string, unknown>) => {
    const node = metadata as NcNode | undefined;
    if (!node) return;

    if (isOtherVariable) {
      setShowOther(node);
      return;
    }

    setNodeCategory(node, bin.value);
  };

  const handleClickItem = (node: NcNode) => {
    if (!isOtherVariable) return;
    setShowOther(node);
  };

  const handleSubmitOtherVariableForm = ({
    otherVariable: value,
  }: {
    otherVariable: string;
  }) => {
    setNodeCategory(showOther!, value);
    setShowOther(null);
  };

  const handleToggle = () => {
    onToggleExpand(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const listSortOrder = prompt?.sortOrder ?? sortOrder;
  const sorter = useMemo(
    () => createSorter<NcNode>(listSortOrder),
    [listSortOrder],
  );
  const sortedNodes = sorter(bin.nodes);

  const listId = `CATBIN_NODE_LIST_${stageId}_${promptId}_${index}`;

  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id: `CATBIN_ITEM_${stageId}_${promptId}_${index}`,
    accepts: ['NODE'],
    announcedName: `Category: ${bin.label}`,
    onDrop: handleDrop,
  });

  const missingValue =
    bin.value === null || (typeof bin.value === 'number' && bin.value < 0);

  const colorStyle = catColor ? { '--cat-color': catColor } : {};

  const otherOverlay = isOtherVariable && (
    <OtherVariableForm
      open={showOther !== null}
      node={showOther!}
      title={bin.otherVariablePrompt ?? 'Other'}
      prompt={bin.otherVariablePrompt!}
      onSubmit={handleSubmitOtherVariableForm}
      onClose={() => setShowOther(null)}
      initialValue={
        showOther
          ? ((getEntityAttributes(showOther)[bin.otherVariable!] ??
              '') as string)
          : ''
      }
    />
  );

  const wrapperClasses = isExpanded
    ? cx(
        'z-10 flex flex-col overflow-hidden border-4 transition-colors',
        // landscape: absolute panel on the left half
        'absolute inset-0 end-auto [inline-size:calc(50%-var(--spacing)*2)]',
        // portrait: panel on the top half instead
        '@[aspect-ratio<1]/catbin:inset-0',
        '@[aspect-ratio<1]/catbin:end-[revert]',
        '@[aspect-ratio<1]/catbin:[inset-block-end:auto]',
        '@[aspect-ratio<1]/catbin:[inline-size:auto]',
        '@[aspect-ratio<1]/catbin:[block-size:calc(50cqb-var(--spacing)*2)]',
        // color
        catColor && 'border-(--cat-color)',
        !catColor && 'border-outline',
        isDragging && willAccept && 'ring-2 ring-(--cat-color) ring-offset-2',
        isOver &&
          willAccept &&
          'shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
      )
    : cx(
        'focusable flex min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden text-center outline-(--cat-color)',
        'border-4 p-4',
        'border-(--cat-color)',
        catColor &&
          !missingValue &&
          'bg-[oklch(from_var(--cat-color)_l_c_h/0.1)]',
        catColor &&
          missingValue &&
          'bg-[oklch(from_var(--cat-color)_calc(l*0.5)_calc(c*0.4)_h/0.1)]',
        !catColor && 'bg-surface',
        isDragging && willAccept && 'ring-2 ring-(--cat-color) ring-offset-2',
        isOver &&
          willAccept &&
          'scale-110 shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
      );

  const wrapperStyle = isExpanded
    ? { ...colorStyle, borderRadius }
    : {
        ...colorStyle,
        borderRadius,
        flexBasis: `${flexBasis}px`,
        aspectRatio: '1 / 1',
      };

  const headerClasses = cx(
    'flex w-full shrink-0 items-center gap-3',
    !isExpanded && 'justify-center text-center',
    isExpanded && 'cursor-pointer px-4 py-3',
    isExpanded &&
      catColor &&
      !missingValue &&
      'bg-[oklch(from_var(--cat-color)_l_c_h/0.15)]',
    isExpanded &&
      catColor &&
      missingValue &&
      'bg-[oklch(from_var(--cat-color)_calc(l*0.5)_calc(c*0.4)_h/0.15)]',
    isExpanded && !catColor && 'bg-surface-1',
  );

  return (
    <>
      <motion.div
        layout
        {...dropProps}
        className={wrapperClasses}
        style={wrapperStyle}
        onClick={(e) => {
          e.stopPropagation();
          if (!isExpanded) handleToggle();
        }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Category ${bin.label}, ${bin.nodes.length} items${isExpanded ? ', expanded' : ''}`}
        transition={springTransition}
        variants={binItemVariants}
      >
        {/* Header persists across states so layout can FLIP-animate it */}
        <motion.div
          layout
          transition={springTransition}
          className={headerClasses}
          onClick={
            isExpanded
              ? (e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleToggle();
                }
              : undefined
          }
        >
          <Heading level={'h4'}>
            <RenderMarkdown>{bin.label}</RenderMarkdown>
          </Heading>
          {isExpanded && (
            <span className="ml-auto text-sm opacity-60">
              {bin.nodes.length}
            </span>
          )}
        </motion.div>

        {isExpanded ? (
          <div className="min-h-0 flex-1 overflow-hidden p-2">
            <motion.div
              initial="initial"
              animate="animate"
              variants={containerVariants}
              className="size-full"
            >
              <NodeList
                id={listId}
                items={sortedNodes}
                nodeSize="sm"
                onItemClick={handleClickItem}
              />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence>
            {bin.nodes.length > 0 && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={containerVariants}
              >
                <BinSummary nodes={bin.nodes} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
      {otherOverlay}
    </>
  );
});

CategoricalBinItem.displayName = 'CategoricalBinItem';

export default CategoricalBinItem;
