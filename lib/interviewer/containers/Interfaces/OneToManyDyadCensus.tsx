import { type Stage } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { MotionNode } from '../../components/Node';
import { nodeListVariants } from '../../components/NodeList';
import Prompts from '../../components/Prompts';
import { edgeExists, toggleEdge } from '../../ducks/modules/session';
import useSortedNodeList from '../../hooks/useSortedNodeList';
import {
  getNetworkEdges,
  getNetworkNodesForType,
} from '../../selectors/session';
import { useAppDispatch } from '../../store';
import { type ProtocolSortRule } from '../../utils/createSorter';
import { type StageProps } from '../Stage';

type OneToManyDyadCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'OneToManyDyadCensus' }>;
};

function OneToManyDyadCensus(props: OneToManyDyadCensusProps) {
  const {
    registerBeforeNext,
    stage: {
      behaviours: { removeAfterConsideration },
    },
  } = props;

  const [currentStep, setCurrentStep] = useState(0);

  const dispatch = useAppDispatch();

  const {
    prompt: { createEdge, bucketSortOrder, binSortOrder },
    promptIndex,
  } = usePrompts<{
    createEdge: string;
    bucketSortOrder?: ProtocolSortRule[];
    binSortOrder?: ProtocolSortRule[];
  }>();

  const nodes = useSelector(getNetworkNodesForType);
  const edges = useSelector(getNetworkEdges);

  const sortedSource = useSortedNodeList(nodes, bucketSortOrder);

  const source = sortedSource[currentStep]!;

  const sortedTargets = useSortedNodeList(
    nodes.filter(
      (node) =>
        node[entityPrimaryKeyProperty] !== source[entityPrimaryKeyProperty],
    ),
    binSortOrder,
  );

  // Takes into account removeAfterConsideration
  // There is one less step if we are removing the source node from the list
  const numberOfSteps = removeAfterConsideration
    ? sortedTargets.length - 1
    : sortedTargets.length;

  /**
   * Hijack stage navigation:
   * - If we are moving forward and not on the last step, increment the step
   * - If we are moving forward and on the last step, allow navigation
   * - If we are moving backward, decrement the step until we reach 0
   * - If we are moving backward and on step 0, allow navigation
   */
  registerBeforeNext((direction) => {
    // disable overflow
    if (containerRef.current) {
      containerRef.current.style.overflowY = 'visible';
    }

    if (direction === 'forwards') {
      if (currentStep + 1 <= numberOfSteps) {
        setCurrentStep((prev) => prev + 1);
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.overflowY = 'auto';
          }
        }, 500);
        return false;
      }

      return true;
    }

    if (direction === 'backwards') {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.overflowY = 'auto';
          }
        }, 500);
        return false;
      }

      return true;
    }

    return true;
  });

  // Reset the step when the prompt changes
  useEffect(() => {
    setCurrentStep(0);
  }, [promptIndex]);

  const handleNodeClick = (source: NcNode, target: NcNode) => () => {
    const edgeAction = toggleEdge({
      from: source[entityPrimaryKeyProperty],
      to: target[entityPrimaryKeyProperty],
      type: createEdge,
    });

    void dispatch(edgeAction);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="one-to-many-dyad-census flex h-full w-full flex-col gap-4 px-[2.4rem] py-[1.2rem]">
      <div className="flex flex-col items-center">
        <Prompts />
        <AnimatePresence mode="wait">
          <motion.div
            variants={nodeListVariants}
            exit={{ opacity: 0 }}
            key={promptIndex}
          >
            {source && (
              <MotionNode
                {...source}
                layoutId={source[entityPrimaryKeyProperty]}
                key={`${source[entityPrimaryKeyProperty]}-${promptIndex}`}
              />
            )}
            {!source && (
              <div
                key="missing"
                className="flex h-24 items-center justify-center"
              >
                No nodes available to display.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex grow flex-col rounded-(--nc-border-radius) bg-(--nc-panel-bg-muted) p-4">
        <div className="mb-4 flex w-full items-center justify-center">
          <h4>Click/tap all that apply:</h4>
        </div>
        {sortedTargets.length === 0 ? (
          <div className="flex h-full w-full grow items-center justify-center">
            <h3>No nodes to display.</h3>
          </div>
        ) : (
          <div className="flex min-h-full grow flex-wrap content-start justify-center overflow-visible [--base-node-size:calc(var(--nc-base-font-size)*8)]">
            <AnimatePresence mode="wait">
              <motion.div
                variants={nodeListVariants}
                key={promptIndex}
                exit={{ opacity: 0 }}
              >
                {sortedTargets.map((node) => {
                  /**
                   * Remove after consideration behaviour:
                   * Once a node has been 'considered' (has been the source), it should be
                   * filtered out of the nodes list. We can calculate this by removing nodes
                   * from the start of the nodes array based on the current step.
                   */
                  const sortedIndex = sortedSource.findIndex(
                    (s) =>
                      s[entityPrimaryKeyProperty] ===
                      node[entityPrimaryKeyProperty],
                  );
                  if (removeAfterConsideration && sortedIndex < currentStep) {
                    return null;
                  }
                  const selected = !!edgeExists(
                    edges,
                    node[entityPrimaryKeyProperty],
                    source[entityPrimaryKeyProperty],
                    createEdge,
                  );

                  return (
                    <MotionNode
                      {...node}
                      selected={selected}
                      onClick={handleNodeClick(source, node)}
                      layoutId={node[entityPrimaryKeyProperty]}
                      key={`${node[entityPrimaryKeyProperty]}-${promptIndex}`}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default withNoSSRWrapper(OneToManyDyadCensus);
