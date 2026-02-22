'use client';

import { get } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import BooleanOption from '~/lib/interviewer/components/BooleanOption';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import {
  getEdgeColorForType,
  getNetworkEdges as getEdges,
  getNetworkNodesForType,
} from '~/lib/interviewer/selectors/session';
import { cx } from '~/utils/cva';
import { type StageProps } from '../../types';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import useAutoAdvance from '../DyadCensus/useAutoAdvance';
import useEdgeState from '../DyadCensus/useEdgeState';
import useSteps from '../DyadCensus/useSteps';
import { getNodePair, getPairs } from './helpers';
import Pair from './Pair';

const fadeVariants = {
  show: { opacity: 1, transition: { duration: 0.5 } },
  hide: { opacity: 0, transition: { duration: 0.5 } },
};

const optionsVariants = {
  show: { opacity: 1, transition: { delay: 0.35, duration: 0.25 } },
  hide: { opacity: 0, transition: { delay: 0.35, duration: 0.25 } },
};

const choiceVariants = {
  show: {
    opacity: 1,
    translateY: '0%',
    transition: { delay: 0.25, type: 'spring' as const },
  },
  hide: { opacity: 0, translateY: '120%' },
};

const introVariants = {
  show: { opacity: 1, scale: 1 },
  hide: { opacity: 0, scale: 0 },
};

export type TieStrengthCensusProps = StageProps<'TieStrengthCensus'>;

const TieStrengthCensus = (props: TieStrengthCensusProps) => {
  const { stage, getNavigationHelpers } = props;

  const { moveForward } = getNavigationHelpers();

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [isValid, setIsValid] = useState(true);

  const {
    promptIndex,
    prompt: { createEdge, edgeVariable, negativeLabel },
    prompts,
  } = usePrompts<{
    createEdge: string;
    edgeVariable?: string;
    negativeLabel: string;
  }>();

  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getEdges, props);
  const edgeColor = useSelector(getEdgeColorForType(createEdge));

  const codebook = usePropSelector(getCodebook, props);
  const edgeVariableOptions = (
    edgeVariable
      ? get(codebook, [
          'edge',
          createEdge,
          'variables',
          edgeVariable,
          'options',
        ])
      : []
  ) as { label: string; value: string | number }[];

  const pairsData = getPairs(nodes);
  const pairs = pairsData.result;
  const steps = Array(prompts.length).fill(pairs.length) as number[];

  const [stepsState, nextStep, previousStep] = useSteps(steps);

  const substepIndex = stepsState.substep;
  const pair =
    substepIndex < pairs.length && substepIndex >= 0
      ? pairs[substepIndex]!
      : null;
  const [fromNode, toNode] = getNodePair(nodes, pair);

  const { hasEdge, edgeVariableValue, setEdge, isTouched, isChanged } =
    useEdgeState(pair, edges, `${stepsState.step}_${stepsState.substep}`);

  useBeforeNext((direction) => {
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

  const handleChange = (nextValue: boolean | string | number) => () => {
    if (isTouched) {
      return;
    }
    setEdge(nextValue);
  };

  const choiceClasses = cx(
    'relative z-(--z-panel) flex w-full min-w-[65vmin] grow-0 flex-col rounded-(--nc-border-radius) border-8 border-transparent p-5',
    {
      'animate-shake border-(--nc-error) outline-offset-[0.75rem]': !isValid,
    },
  );

  return (
    <div className="flex h-full flex-col items-center justify-center">
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
            className="flex size-full flex-col"
          >
            <div className="flex flex-[0_0_var(--interface-prompt-flex-basis)] items-center justify-center text-center">
              <Prompts />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                className="relative mt-4 min-h-0 flex-[1_auto]"
                key={promptIndex}
                variants={fadeVariants}
                initial="hide"
                exit="hide"
                animate="show"
              >
                <div className="absolute top-0 left-0 flex size-full flex-col items-center justify-center">
                  <div className="relative flex w-full grow items-center justify-center">
                    <AnimatePresence custom={[isForwards]} initial={false}>
                      <Pair
                        key={`${stepsState.step}_${stepsState.substep}`}
                        edgeColor={edgeColor}
                        hasEdge={hasEdge}
                        animateForwards={isForwards}
                        fromNode={fromNode}
                        toNode={toNode}
                      />
                    </AnimatePresence>
                  </div>
                  <motion.div
                    className={choiceClasses}
                    variants={choiceVariants}
                    initial="hide"
                    animate="show"
                    style={{
                      maxWidth: `${
                        (edgeVariableOptions.length + 1) * 20 + 3.6
                      }rem`,
                    }}
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
                                  {edgeVariableOptions.map(
                                    (option: {
                                      label: string;
                                      value: string | number;
                                    }) => (
                                      <BooleanOption
                                        key={option.value}
                                        selected={
                                          !!hasEdge &&
                                          edgeVariableValue === option.value
                                        }
                                        onClick={handleChange(option.value)}
                                        label={option.label}
                                      />
                                    ),
                                  )}
                                  <BooleanOption
                                    classes="boolean-option--no"
                                    selected={!hasEdge && hasEdge === false}
                                    onClick={handleChange(false)}
                                    label={negativeLabel}
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
};

export default TieStrengthCensus;
