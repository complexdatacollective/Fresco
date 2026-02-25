import { type Stage } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { type DragMetadata, useDropTarget } from '~/lib/dnd';
import { useCelebrate } from '~/lib/interviewer/hooks/useCelebrate';
import { getCurrentStageId } from '~/lib/interviewer/selectors/session';
import { cx } from '~/utils/cva';
import NodeList from '../../../components/NodeList';
import { usePrompts } from '../../../components/Prompts/usePrompts';
import BinSummary from './BinSummary';

type CategoricalBinItemProps = {
  label: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  catColor: string | null;
  onDropNode: (node: NcNode) => Promise<void>;
  flexBasis: number;
  nodes: NcNode[];
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

type CategoricalBinPrompts = Extract<
  Stage,
  { type: 'CategoricalBin' }
>['prompts'][number];

const CategoricalBinItem = (props: CategoricalBinItemProps) => {
  const {
    label,
    isExpanded,
    onToggleExpand,
    catColor,
    onDropNode,
    flexBasis,
    nodes,
  } = props;

  const {
    prompt: { id: promptId },
  } = usePrompts<CategoricalBinPrompts>();
  const stageId = useSelector(getCurrentStageId);
  const binRef = useRef<HTMLDivElement>(null);
  const celebrate = useCelebrate(binRef, {
    particleSize: 'large',
    particleColor: catColor ?? 'random',
  });

  const handleDrop = async (metadata?: DragMetadata) => {
    const node = metadata as NcNode;
    await onDropNode(node);
    celebrate();
  };

  const listId = `CATBIN_NODE_LIST_${stageId}_${promptId}_${label}`;
  const layoutId = `catbin-${promptId}-${label}`;

  const {
    dropProps: { ref: dropRef, ...dropPropsRest },
    isOver,
    willAccept,
  } = useDropTarget({
    id: `CATBIN_ITEM_${stageId}_${promptId}_${label}`,
    accepts: ['NODE'],
    announcedName: `Category: ${label}`,
    onDrop: handleDrop,
  });

  const mergedRef = useCallback(
    (el: HTMLDivElement | null) => {
      binRef.current = el;
      dropRef(el);
    },
    [dropRef],
  );

  const colorStyle = catColor
    ? ({ '--cat-color': catColor } as React.CSSProperties)
    : {};

  if (isExpanded) {
    const panelClasses = cx(
      'catbin-expanded z-10 flex flex-col overflow-hidden border-4 transition-colors',
      catColor && 'border-(--cat-color)',
      !catColor && 'border-outline',
      isOver &&
        willAccept &&
        'shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
    );

    const headerClasses = cx(
      'flex shrink-0 cursor-pointer items-center gap-3 px-4 py-3',
      catColor && 'bg-[oklch(from_var(--cat-color)_l_c_h/0.15)]',
      !catColor && 'bg-surface-1',
    );

    return (
      <>
        <motion.div
          ref={binRef}
          layout
          layoutId={layoutId}
          className={panelClasses}
          style={{ ...colorStyle, borderRadius: 16 }}
          onClick={(e) => e.stopPropagation()}
          transition={springTransition}
          variants={binItemVariants}
          initial="initial"
          animate="animate"
        >
          <div
            className={headerClasses}
            onClick={onToggleExpand}
            role="button"
            tabIndex={0}
            aria-expanded={true}
            aria-label={`Category ${label}, ${nodes.length} items, expanded`}
          >
            <Heading level="h3">
              <RenderMarkdown>{label}</RenderMarkdown>
            </Heading>
            <span className="ml-auto text-sm opacity-60">{nodes.length}</span>
          </div>
          <div
            ref={dropRef}
            {...dropPropsRest}
            className="min-h-0 flex-1 overflow-hidden p-2"
          >
            <motion.div
              initial="initial"
              animate="animate"
              className="size-full"
            >
              <NodeList
                id={listId}
                items={nodes}
                nodeSize="sm"
                announcedName={`${label} category`}
              />
            </motion.div>
          </div>
        </motion.div>
      </>
    );
  }

  const circleClasses = cx(
    'focusable flex min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden text-center outline-(--cat-color)',
    'border-4 p-4',
    'border-(--cat-color)',
    catColor && 'bg-[oklch(from_var(--cat-color)_l_c_h/0.1)]',
    !catColor && 'bg-surface',
    isOver &&
      willAccept &&
      'scale-110 shadow-[0_0_24px_var(--cat-color)] ring-4 ring-(--cat-color)',
  );

  return (
    <motion.div
      ref={mergedRef}
      role="button"
      tabIndex={0}
      layout
      layoutId={layoutId}
      {...dropPropsRest}
      className={circleClasses}
      style={{
        ...colorStyle,
        flexBasis: `${flexBasis}px`,
        aspectRatio: '1 / 1',
        borderRadius: '50%',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggleExpand();
      }}
      aria-expanded={false}
      aria-label={`Category ${label}, ${nodes.length} items`}
      transition={springTransition}
      variants={binItemVariants}
    >
      <Heading level="h4">
        <RenderMarkdown>{label}</RenderMarkdown>
      </Heading>
      <AnimatePresence>
        {nodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BinSummary nodes={nodes} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoricalBinItem;
