import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { type StageProps } from '~/lib/interviewer/types';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import {
  getEdgeColorForType,
  getNetworkEdges,
  getNetworkNodesForType,
} from '~/lib/interviewer/selectors/session';
import { cx } from '~/utils/cva';
import BooleanOption from '~/lib/interviewer/components/BooleanOption';
import Pair from './components/Pair';
import { getNodePair, getPairs } from './helpers';
import useAutoAdvance from './useAutoAdvance';
import useEdgeState from './useEdgeState';
import useSteps from './useSteps';

const fadeVariants = {
  show: { opacity: 1, transition: { duration: 0.5 } },
  hide: { opacity: 0, transition: { duration: 0.5 } },
};

const optionsVariants = {
  show: { opacity: 1, transition: { delay: 0.15, duration: 0.25 } },
  hide: { opacity: 0, transition: { delay: 0.15, duration: 0.25 } },
};

const choiceVariants = {
  show: {
    opacity: 1,
    translateY: '0%',
    transition: { delay: 0.15, type: 'spring' as const },
  },
  hide: { opacity: 0, translateY: '120%' },
};

const introVariants = {
  show: { opacity: 1, scale: 1 },
  hide: { opacity: 0, scale: 0 },
};

type DyadCensusProps = StageProps<'DyadCensus'>;

export default function DyadCensus(props: DyadCensusProps) {
  const { registerBeforeNext, stage, getNavigationHelpers } = props;

  const { moveForward } = getNavigationHelpers();

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [isValid, setIsValid] = useState(true);

  const {
    prompt: { createEdge },
    promptIndex,
    prompts,
  } = usePrompts<(typeof stage.prompts)[number]>();

  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getNetworkEdges, props);
  const edgeColor = useSelector(getEdgeColorForType(createEdge));

  const pairsData = getPairs(nodes);
  const pairs = pairsData.result;
  const steps: number[] = Array(prompts.length).fill(pairs.length) as number[];

  const [stepsState, nextStep, previousStep] = useSteps(steps);

  const substepIndex = stepsState.substep;
  const pair =
    substepIndex < pairs.length && substepIndex >= 0
      ? (pairs[substepIndex] ?? null)
      : null;

  const [fromNode, toNode] = getNodePair(nodes, pair);

  const { hasEdge, setEdge, isTouched, isChanged } = useEdgeState(
    pair,
    edges,
    `${stepsState.step}_${stepsState.substep}`,
  );

  registerBeforeNext((direction) => {
    if (direction === 'forwards') {
      setForwards(true);
      setIsValid(true);

      if (isIntroduction) {
        if (stepsState.totalSteps === 0) {
          return 'FORCE';
        }

        setIsIntroduction(false);
        return false;
      }

      if (hasEdge === null) {
        setIsValid(false);
        return false;
      }

      if (stepsState.isStepEnd || stepsState.isEnd) {
        nextStep();
        return true;
      }

      nextStep();
      return false;
    }

    if (direction === 'backwards') {
      setForwards(false);
      setIsValid(true);

      if (isIntroduction) {
        return true;
      }

      if (stepsState.isStart) {
        setIsIntroduction(true);
        return false;
      }

      if (stepsState.isStepStart) {
        previousStep();
        return true;
      }

      previousStep();
      return false;
    }

    return false;
  });

  useAutoAdvance(moveForward, isTouched, isChanged);

  const handleChange = (nextValue: boolean) => () => {
    if (isTouched) {
      return;
    }
    setEdge(nextValue);
  };

  const choiceClasses = cx(
    'relative z-(--z-panel) flex w-[70vmin] shrink-0 grow-0 flex-col rounded-(--nc-border-radius) border-[0.5rem] border-transparent p-5 text-center',
    {
      'animate-shake border-(--nc-error) outline-offset-[0.75rem]': !isValid,
    },
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <AnimatePresence initial={false} mode="wait">
        {isIntroduction && (
          <MotionSurface
            noContainer
            className="w-full max-w-2xl grow-0"
            variants={introVariants}
            initial="hide"
            exit="hide"
            animate="show"
            key="intro"
          >
            <Heading level="h1" className="text-center">
              {stage.introductionPanel.title}
            </Heading>
            <RenderMarkdown>{stage.introductionPanel.text}</RenderMarkdown>
          </MotionSurface>
        )}
        {!isIntroduction && (
          <motion.div
            key="content"
            variants={fadeVariants}
            initial="hide"
            exit="hide"
            animate="show"
            className="flex w-full flex-1 flex-col"
          >
            <div className="flex-[0_0_var(--interface-prompt-flex-basis)]">
              <Prompts />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                className="flex flex-auto"
                key={promptIndex}
                variants={fadeVariants}
                initial="hide"
                exit="hide"
                animate="show"
              >
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className="relative flex w-full flex-1 items-center justify-center">
                    <AnimatePresence custom={[isForwards]} initial={false}>
                      {fromNode && toNode && (
                        <Pair
                          key={`${stepsState.step}_${stepsState.substep}`}
                          edgeColor={edgeColor as string}
                          hasEdge={hasEdge}
                          animateForwards={isForwards}
                          fromNode={fromNode}
                          toNode={toNode}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.div
                    className={choiceClasses}
                    variants={choiceVariants}
                    layout
                    initial="hide"
                    animate="show"
                  >
                    <div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={stepsState.step}
                          className="flex items-center justify-center"
                          variants={optionsVariants}
                          initial="hide"
                          animate="show"
                          exit="hide"
                        >
                          <div className="form-field-container form-field-boolean">
                            <div className="form-field-boolean__control">
                              <div>
                                <div className="boolean__options">
                                  <BooleanOption
                                    selected={!!hasEdge && hasEdge !== null}
                                    onClick={handleChange(true)}
                                    label={() => <h1>Yes</h1>}
                                  />
                                  <BooleanOption
                                    classes="boolean-option--no"
                                    onClick={handleChange(false)}
                                    selected={!hasEdge && hasEdge !== null}
                                    label={() => <h1>No</h1>}
                                    negative
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
