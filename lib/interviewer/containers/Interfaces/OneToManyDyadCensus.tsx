import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
  type StageSubject,
} from '~/lib/shared-consts';
import Node from '../../components/Node';
import Prompts from '../../components/Prompts';
import { edgeExists, toggleEdge } from '../../ducks/modules/session';
import { useAppDispatch } from '../../hooks/redux';
import {
  getNetworkEdges,
  getNetworkNodesForType,
} from '../../selectors/session';
import { type StageProps } from '../Stage';

const MotionNode = motion.create(Node);

const cardvariants: Variants = {
  hide: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { when: 'beforeChildren' } },
};

type OneToManyDyadCensusProps = Omit<StageProps, 'stage'> & {
  stage: {
    subject: StageSubject;
  };

  // add any additional props here
};

export default function OneToManyDyadCensus(props: OneToManyDyadCensusProps) {
  const { registerBeforeNext } = props;
  const [currentStep, setCurrentStep] = useState(0);
  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getNetworkEdges, props);

  console.log(edges);

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
  } = usePrompts();

  const dispatch = useAppDispatch();

  // Reset the step when the prompt changes
  useEffect(() => {
    setCurrentStep(0);
  }, [promptIndex]);

  const handleNodeClick = (node: NcNode) => () => {
    dispatch(
      toggleEdge({
        modelData: {
          from: source![entityPrimaryKeyProperty],
          to: node[entityPrimaryKeyProperty],
          type: createEdge!,
        },
      }),
    );
  };

  return (
    <div className="one-to-many-dyad-census flex h-full w-full flex-col px-[2.4rem] py-[1.2rem]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={promptIndex}
          variants={cardvariants}
          initial="hide"
          exit="hide"
          animate="show"
          className="flex h-full grow flex-col gap-4"
        >
          <div className="flex flex-col items-center">
            <Prompts />
            <div>
              <MotionNode
                {...source}
                linking
                layoutId={source![entityPrimaryKeyProperty]}
                key={source![entityPrimaryKeyProperty]}
                variants={cardvariants}
              />
            </div>
          </div>

          <div className="grow rounded-(--nc-border-radius) border bg-(--nc-panel-bg-muted) p-4">
            {targets.map((node) => {
              const selected = !!edgeExists(
                edges,
                node[entityPrimaryKeyProperty],
                source![entityPrimaryKeyProperty],
                createEdge,
              );

              console.log(selected, edges);

              return (
                <MotionNode
                  {...node}
                  layoutId={node[entityPrimaryKeyProperty]}
                  key={node[entityPrimaryKeyProperty]}
                  selected={selected}
                  handleClick={handleNodeClick(node)}
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
