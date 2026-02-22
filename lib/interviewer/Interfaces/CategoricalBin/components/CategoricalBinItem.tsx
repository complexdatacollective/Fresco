import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useState } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import { useDropTarget } from '~/lib/dnd';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { cx } from '~/utils/cva';
import Overlay from '../../../components/Overlay';
import { updateNode } from '../../../ducks/modules/session';
import { useAppDispatch } from '../../../store';
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
  onToggleExpand: (index: number) => void;
  catColor: string | null;
};

const CategoricalBinItem = memo((props: CategoricalBinItemProps) => {
  const {
    bin,
    index,
    activePromptVariable,
    promptOtherVariable,
    stageId,
    promptId,
    onToggleExpand,
    catColor,
  } = props;

  const dispatch = useAppDispatch();

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

  const circleClasses = cx(
    'flex size-full cursor-pointer flex-col items-center justify-center gap-2 text-center transition-all',
    'rounded-full border-4 p-4',
    catColor && 'border-(--cat-color)',
    !catColor && 'border-outline',
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
      <div
        {...dropProps}
        className={circleClasses}
        style={colorStyle}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={false}
        aria-label={`Category ${bin.label}, ${bin.nodes.length} items`}
      >
        <h3 className="text-base font-semibold">
          <RenderMarkdown>{bin.label}</RenderMarkdown>
        </h3>
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
      </div>

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
});

CategoricalBinItem.displayName = 'CategoricalBinItem';

export default CategoricalBinItem;
