import { type Stage } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import Node from '~/lib/interviewer/components/Node';
import { type StageProps } from '~/lib/interviewer/types';
import NodeDrawer from '../../components/NodeDrawer';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import { updateNode } from '../../ducks/modules/session';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { useAppDispatch } from '../../store';
import CategoricalBinItem from './components/CategoricalBinItem';
import { useCategoricalBins } from './useCategoricalBins';
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

const getCatColor = (index: number, isOther: boolean) => {
  if (index < 0) return null;
  const colorVar = CAT_COLOR_VARS[index % CAT_COLOR_VARS.length]!;

  if (isOther) {
    return `oklch(from ${colorVar} calc(l*0.5) calc(c*0.4) h)`;
  }

  return colorVar;
};

type CategoricalBinPrompts = Extract<
  Stage,
  { type: 'CategoricalBin' }
>['prompts'][number];

const CategoricalBin = (_props: CategoricalBinStageProps) => {
  const [expandedBinIndex, setExpandedBinIndex] = useState<number | null>(null);

  const {
    prompt: { id, otherVariable, otherVariablePrompt, variable },
  } = usePrompts<CategoricalBinPrompts>();

  const { bins, uncategorisedNodes } = useCategoricalBins();

  const { updateReady } = useReadyForNextStage();

  useEffect(() => {
    updateReady(uncategorisedNodes.length === 0);
  }, [uncategorisedNodes.length, updateReady]);

  // Reset expanded bin when prompt changes
  useEffect(() => {
    setExpandedBinIndex(null);
  }, [id]);

  const hasExpanded = expandedBinIndex !== null;

  const circleCount = hasExpanded ? bins.length - 1 : bins.length;
  const { containerRef, flexBasis } = useCircleLayout({
    count: circleCount,
  });

  const dispatch = useAppDispatch();
  const { openDialog } = useDialog();

  const handleDropNode = async (node: NcNode, binIndex: number) => {
    const nodeId = node[entityPrimaryKeyProperty];

    const category = binIndex === -1 ? null : bins[binIndex]!.value;

    // If the node is being dropped into the 'other' bin, show a dialog to specify the value for the other variable
    if (binIndex === -1 && otherVariable) {
      const result = await openDialog({
        type: 'form',
        title: 'Specify other',
        description: 'Please specify the category for this item.',
        children: (
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <Node
                _uid={node[entityPrimaryKeyProperty]}
                type={node.type}
                attributes={node.attributes}
              />
            </div>
            <Field
              label={otherVariablePrompt!}
              placeholder="Enter your response here..."
              component={InputField}
              name="otherVariable"
              required
              autoFocus
            />
          </div>
        ),
        intent: 'default',
      });

      if (!result) return;

      await dispatch(
        updateNode({
          nodeId,
          newAttributeData: {
            [variable]: null,
            [otherVariable]:
              typeof result.otherVariable === 'string'
                ? result.otherVariable
                : null,
          },
        }),
      );

      return;
    }
    await dispatch(
      updateNode({
        nodeId,
        newAttributeData: {
          ...(otherVariable ? { [otherVariable]: null } : {}),
          [variable]: category,
        },
      }),
    );
  };

  return (
    <div
      className="interface relative flex h-full flex-col overflow-hidden"
      onClick={() => {
        setExpandedBinIndex(null);
      }}
    >
      <Prompts />

      <div className="catbin-outer min-h-0 w-full flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={id}
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
                label={bin.label}
                isExpanded={index === expandedBinIndex}
                onToggleExpand={() => setExpandedBinIndex(index)}
                catColor={getCatColor(index, bin.isOther)}
                onDropNode={(node) => handleDropNode(node, index)}
                nodes={bin.nodes}
                flexBasis={flexBasis}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <NodeDrawer
        nodes={uncategorisedNodes}
        itemType="NODE"
        expanded={hasExpanded ? false : undefined}
      />
    </div>
  );
};

export default CategoricalBin;
