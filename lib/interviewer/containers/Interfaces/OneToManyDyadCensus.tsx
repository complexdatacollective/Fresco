import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import Node from '../../components/Node';
import Prompts from '../../components/Prompts';
import { getNetworkNodesForType } from '../../selectors/interface';
import { getNetworkEdges } from '../../selectors/network';
import { type StageProps } from '../Stage';

/**
 * For a given nodelist, we need to cycle through each node, and offer the
 * participant a list of the rest of the nodes that could be linked to.
 *
 * Because edges are assumed to be undirected, we can remove pairs that have
 * already been considered.
 *
 * This function generates a data structure that allows this, which looks like
 * the following:
 *
 * [
 *    {
 *      source: NcNode,
 *      targets: NcNode[]
 *    }
 * ]
 */
const generateEdgeOptions = (nodes: NcNode[]) => {
  const options = [];

  for (const source of nodes) {
    const targets = nodes.filter(
      (node) =>
        node[entityAttributesProperty] !== source[entityAttributesProperty],
    );

    options.push({
      source,
      targets,
    });
  }

  return options;
};

const cardvariants = {
  hide: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

type OneToManyDyadCensusProps = StageProps & {
  // add any additional props here
};

export default function OneToManyDyadCensus(props: OneToManyDyadCensusProps) {
  const { registerBeforeNext, stage } = props;
  const [currentStep, setCurrentStep] = useState(0);
  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getNetworkEdges, props);

  const options = generateEdgeOptions(nodes);

  /**
   * Hijack stage navigation:
   * - If we are moving forward and not on the last step, increment the step
   * - If we are moving forward and on the last step, allow navigation
   * - If we are moving backward, decrement the step until we reach 0
   * - If we are moving backward and on step 0, allow navigation
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  registerBeforeNext(async () => {
    if (currentStep < options.length - 1) {
      setCurrentStep(currentStep + 1);
      return false;
    }

    return true;
  });

  const {
    prompt: { createEdge },
    promptIndex,
    prompts,
  } = usePrompts();

  console.log({ nodes, edges, options: generateEdgeOptions(nodes) });

  // Reset the step when the prompt changes
  useEffect(() => {
    setCurrentStep(0);
  }, [promptIndex]);

  return (
    <div className="one-to-many-dyad-census flex h-full w-full flex-col">
      <div className="shrink-0 grow-0 overflow-auto">
        <Prompts />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={promptIndex}
          className="m-10 flex grow flex-col rounded-(--nc-border-radius) bg-(--nc-panel-bg-muted) p-4"
          variants={cardvariants}
          initial="hide"
          exit="hide"
          animate="show"
        >
          <div>
            <motion.div
              layoutId={options[currentStep]?.source[entityPrimaryKeyProperty]}
              // layout
              key={options[currentStep]?.source[entityPrimaryKeyProperty]}
              className="inline-block"
            >
              <Node {...options[currentStep]?.source} isStatic />
            </motion.div>
          </div>
          <div>
            {options[currentStep]?.targets.map((node) => (
              <motion.div
                layoutId={node[entityPrimaryKeyProperty]}
                // layout
                key={node[entityPrimaryKeyProperty]}
                className="inline-block"
              >
                <Node {...node} isStatic />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
