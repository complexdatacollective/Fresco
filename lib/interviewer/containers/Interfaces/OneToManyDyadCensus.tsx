import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { type UnknownAction } from '@reduxjs/toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import Node from '../../components/Node';
import Prompts from '../../components/Prompts';
import { edgeExists, toggleEdge } from '../../ducks/modules/session';
import {
  getNetworkEdges,
  getNetworkNodesForType,
} from '../../selectors/session';
import { type StageProps } from '../Stage';

const MotionNode = motion.create(Node);

type OneToManyDyadCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'OneToManyDyadCensus' }>;
};

function OneToManyDyadCensus(props: OneToManyDyadCensusProps) {
  const { registerBeforeNext } = props;
  const [currentStep, setCurrentStep] = useState(0);
  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getNetworkEdges, props);

  const targets = nodes.filter(
    (node) =>
      node[entityAttributesProperty] !==
      nodes[currentStep]?.[entityAttributesProperty],
  );

  const source = nodes[currentStep];

  /**
   * Hijack stage navigation:
   * - If we are moving forward and not on the last step, increment the step
   * - If we are moving forward and on the last step, allow navigation
   * - If we are moving backward, decrement the step until we reach 0
   * - If we are moving backward and on step 0, allow navigation
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  registerBeforeNext(async (direction) => {
    if (direction === 'forwards') {
      if (currentStep < nodes.length - 1) {
        setCurrentStep((prev) => prev + 1);
        return false;
      }

      return true;
    }

    if (direction === 'backwards') {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        return false;
      }

      return true;
    }

    return true;
  });

  const {
    prompt: { createEdge },
    promptIndex,
  } = usePrompts<{
    createEdge: string;
    bucketSortOrder?: {
      property: string;
      direction: 'asc' | 'desc';
      type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
      hierarchy?: Array<string | number | boolean>;
    }[];
    binSortOrder?: {
      property: string;
      direction: 'asc' | 'desc';
      type?: 'string' | 'number' | 'date' | 'boolean' | 'hierarchy';
      hierarchy?: Array<string | number | boolean>;
    };
  }>();

  const dispatch = useDispatch();

  // Reset the step when the prompt changes
  useEffect(() => {
    setCurrentStep(0);
  }, [promptIndex]);

  const handleNodeClick = (source: NcNode, target: NcNode) => () => {
    const edgeAction = toggleEdge({
      modelData: {
        from: source[entityPrimaryKeyProperty],
        to: target[entityPrimaryKeyProperty],
        type: createEdge,
      },
    }) as unknown as UnknownAction;

    dispatch(edgeAction);
  };

  return (
    <div className="one-to-many-dyad-census flex h-full w-full flex-col px-[2.4rem] py-[1.2rem]">
      <div className="flex flex-col items-center overflow-visible">
        <Prompts />
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={promptIndex}
          >
            {source && (
              <MotionNode
                {...source}
                layout
                layoutId={`${source[entityPrimaryKeyProperty]}-${promptIndex}`}
                key={`${source[entityPrimaryKeyProperty]}-${promptIndex}`}
              />
            )}
            {!source && <div>No nodes available to display.</div>}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div className="flex grow flex-col overflow-visible rounded-(--nc-border-radius) border bg-(--nc-panel-bg-muted) p-4">
        <div className="mb-4 flex w-full items-center justify-center">
          <h4>Click/tap all that apply:</h4>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            layoutScroll
            className="flex w-full grow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ when: 'beforeChildren' }}
            key={promptIndex}
          >
            {source &&
              targets.map((node) => {
                const selected = !!edgeExists(
                  edges,
                  node[entityPrimaryKeyProperty],
                  source[entityPrimaryKeyProperty],
                  createEdge,
                );

                return (
                  <MotionNode
                    {...node}
                    layout
                    layoutId={`${node[entityPrimaryKeyProperty]}-${promptIndex}`}
                    key={`${node[entityPrimaryKeyProperty]}-${promptIndex}`}
                    selected={selected}
                    handleClick={handleNodeClick(source, node)}
                  />
                );
              })}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default withNoSSRWrapper(OneToManyDyadCensus);
