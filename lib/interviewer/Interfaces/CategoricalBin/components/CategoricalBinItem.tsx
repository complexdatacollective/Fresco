import { type Prompt } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useMemo, useState } from 'react';
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
  animate: { opacity: 1, scale: 1, transition: { type: 'spring' as const } },
  exit: { opacity: 0, scale: 0.4, transition: { duration: 0.15 } },
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
  const layoutId = `catbin-${promptId}-${index}`;

  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id: `CATBIN_ITEM_${stageId}_${promptId}_${index}`,
    accepts: ['NODE'],
    announcedName: `Category: ${bin.label}`,
    onDrop: handleDrop,
  });

  const missingValue =
    bin.value === null || (typeof bin.value === 'number' && bin.value < 0);

  const colorStyle = catColor
    ? ({ '--cat-color': catColor } as React.CSSProperties)
    : {};

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

  if (isExpanded) {
    const panelClasses = cx(
      'catbin-expanded z-10 flex flex-col overflow-hidden border-4 transition-colors',
      catColor && 'border-(--cat-color)',
      !catColor && 'border-outline',
      isDragging && willAccept && 'ring-2 ring-(--cat-color) ring-offset-2',
      isOver &&
        willAccept &&
        'shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
    );

    const headerClasses = cx(
      'flex shrink-0 cursor-pointer items-center gap-3 px-4 py-3',
      catColor &&
        !missingValue &&
        'bg-[oklch(from_var(--cat-color)_l_c_h/0.15)]',
      catColor &&
        missingValue &&
        'bg-[oklch(from_var(--cat-color)_calc(l*0.5)_calc(c*0.4)_h/0.15)]',
      !catColor && 'bg-surface-1',
    );

    return (
      <>
        <motion.div
          layout
          layoutId={layoutId}
          className={panelClasses}
          style={{ ...colorStyle, borderRadius: 16 }}
          transition={springTransition}
          variants={binItemVariants}
          initial="initial"
          animate="animate"
        >
          <div
            className={headerClasses}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={true}
            aria-label={`Category ${bin.label}, ${bin.nodes.length} items, expanded`}
          >
            <Heading level="h3">
              <RenderMarkdown>{bin.label}</RenderMarkdown>
            </Heading>
            <span className="ml-auto text-sm opacity-60">
              {bin.nodes.length}
            </span>
          </div>
          <div {...dropProps} className="min-h-0 flex-1 overflow-hidden p-2">
            <motion.div
              initial="initial"
              animate="animate"
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
        </motion.div>
        {otherOverlay}
      </>
    );
  }

  const circleClasses = cx(
    'focusable flex min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden text-center outline-(--cat-color)',
    'border-4 p-4',
    'border-(--cat-color)',
    catColor && !missingValue && 'bg-[oklch(from_var(--cat-color)_l_c_h/0.1)]',
    catColor &&
      missingValue &&
      'bg-[oklch(from_var(--cat-color)_calc(l*0.5)_calc(c*0.4)_h/0.1)]',
    !catColor && 'bg-surface',
    isDragging && willAccept && 'ring-2 ring-(--cat-color) ring-offset-2',
    isOver &&
      willAccept &&
      'scale-110 shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
  );

  return (
    <>
      <motion.div
        layout
        layoutId={layoutId}
        {...dropProps}
        className={circleClasses}
        style={{
          ...colorStyle,
          flexBasis: `${flexBasis}px`,
          aspectRatio: '1 / 1',
          borderRadius: '50%',
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={false}
        aria-label={`Category ${bin.label}, ${bin.nodes.length} items`}
        transition={springTransition}
        variants={binItemVariants}
      >
        <Heading level="h4">
          <RenderMarkdown>{bin.label}</RenderMarkdown>
        </Heading>
        <AnimatePresence>
          {bin.nodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BinSummary nodes={bin.nodes} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {otherOverlay}
    </>
  );
});

CategoricalBinItem.displayName = 'CategoricalBinItem';

export default CategoricalBinItem;
