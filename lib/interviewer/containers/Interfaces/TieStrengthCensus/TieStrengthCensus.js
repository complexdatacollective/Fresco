import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import BooleanOption from '~/lib/ui/components/Boolean/BooleanOption';
import { AnimatePresence, motion } from 'framer-motion';
import { Markdown } from '~/lib/ui/components/Fields';
import Prompts from '../../../components/Prompts';
import { usePrompts } from '../../../behaviours/withPrompt';
import { getNetworkNodesForType, getVariableOptions } from '../../../selectors/interface';
import { getEdgeColor, getNetworkEdges as getEdges } from '../../../selectors/network';
import { getPairs, getNodePair } from './helpers';
import useSteps from './useSteps';
import useNetworkEdgeState from './useEdgeState';
import useAutoAdvance from './useAutoAdvance';
import Pair from './Pair';
import { get } from '../../../utils/lodash-replacements';
import { useNavigationHelpers } from '~/lib/interviewer/hooks/useNavigationHelpers';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';

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
    transition: { delay: 0.25, type: 'spring' },
  },
  hide: { opacity: 0, translateY: '120%' },
};

const introVariants = {
  show: { opacity: 1, scale: 1 },
  hide: { opacity: 0, scale: 0 },
};

/**
 * Dyad Census Interface
 */
const TieStrengthCensus = (props) => {
  const {
    registerBeforeNext,
    stage,
  } = props;

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [isValid, setIsValid] = useState(true);

  // Number of pairs times number of prompts e.g. `[3, 3, 3]`
  const steps = Array(stage.prompts.length).fill(get(pairs, 'length', 0));
  const [stepsState, nextStep, previousStep] = useSteps(steps);

  const {
    promptIndex,
    prompt,
  } = usePrompts();

  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getEdges, props);
  const edgeColor = usePropSelector(getEdgeColor, {
    type: prompt?.createEdge
  })

  const edgeVariableOptions = usePropSelector(getVariableOptions, {
    subject: {
      entity: 'edge',
      type: prompt?.createEdge,
    },
    variable: prompt?.edgeVariable,
  });


  const pairs = getPairs(nodes);



  const pair = get(pairs, stepsState.substep, null);
  const [fromNode, toNode] = getNodePair(nodes, pair);

  const {
    moveBackward,
    moveForward,
    currentStep,
  } = useNavigationHelpers();



  const {
    createEdge, // Edge type to create
    edgeVariable, // Edge variable to set value of
    negativeLabel, // Label for the "reject" option
  } = prompt;

  // hasEdge:
  //  - false: user denied
  //  - null: not yet decided
  //  - true: edge exists
  const [hasEdge, edgeVariableValue, setEdge, isTouched, isChanged] =
    useNetworkEdgeState(
      edges,
      createEdge, // Type of edge to create
      edgeVariable, // Edge ordinal variable
      pair,
      prompt.id,
      currentStep,
      [stepsState.step],
    );

  const next = useCallback(() => {
    setForwards(true);
    setIsValid(true);

    if (isIntroduction) {
      // If there are no steps, clicking next should advance the stage
      if (stepsState.totalSteps === 0) {
        moveForward({ forceChangeStage: true });
        return;
      }

      setIsIntroduction(false);
      return;
    }

    // check that the edgeVariable has a value
    // hasEdge is false when user has declined, but null when it doesn't exist yet
    // edgeVariableValue is null when edge doesn't exist, or variable isn't set
    if (hasEdge === null && edgeVariableValue === null) {
      setIsValid(false);
      return;
    }

    if (stepsState.isStageEnd) {
      moveForward();
    }

    if (stepsState.isEnd) {
      return;
    }

    nextStep();
  }, [
    edgeVariableValue,
    hasEdge,
    isIntroduction,
    moveForward,
    nextStep,
    stepsState.isEnd,
    stepsState.isStageEnd,
    stepsState.totalSteps,
  ]);

  const back = useCallback(() => {
    setForwards(false);
    setIsValid(true);

    if (stepsState.isStart && !isIntroduction) {
      setIsIntroduction(true);
      return;
    }

    if (stepsState.isStageStart) {
      if (stepsState.totalSteps === 0) {
        moveBackward({ forceChangeStage: true });
        return;
      }
      moveBackward();
    }

    if (stepsState.isStart) {
      return;
    }

    previousStep();
  }, [
    isIntroduction,
    moveBackward,
    previousStep,
    stepsState.isStageStart,
    stepsState.isStart,
    stepsState.totalSteps,
  ]);

  const beforeNext = useCallback(
    (direction) => {
      if (direction === 'backwards') {
        back();
      } else {
        next();
      }

      return false;
    },
    [back, next],
  );

  useEffect(() => {
    registerBeforeNext(beforeNext);
  }, [beforeNext, registerBeforeNext]);

  useAutoAdvance(next, isTouched, isChanged);

  const handleChange = (nextValue) => () => {
    // 'debounce' clicks, one click (isTouched) should start auto-advance
    // so ignore further clicks
    if (isTouched) {
      return;
    }
    setEdge(nextValue);
  };

  const choiceClasses = cx('tie-strength-census__choice', {
    'tie-strength-census__choice--invalid': !isValid,
  });

  return (
    <div className="tie-strength-census">
      <AnimatePresence initial={false} mode="wait">
        {isIntroduction && (
          <motion.div
            className="tie-strength-census__introduction"
            variants={introVariants}
            initial="hide"
            exit="hide"
            animate="show"
            key="intro"
          >
            <h1>{stage.introductionPanel.title}</h1>
            <Markdown label={stage.introductionPanel.text} />
          </motion.div>
        )}
        {!isIntroduction && (
          <motion.div
            key="content"
            variants={fadeVariants}
            initial="hide"
            exit="hide"
            animate="show"
            className="tie-strength-census__wrapper"
          >
            <div className="tie-strength-census__prompt">
              <Prompts />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                className="tie-strength-census__main"
                key={promptIndex}
                variants={fadeVariants}
                initial="hide"
                exit="hide"
                animate="show"
              >
                <div className="tie-strength-census__layout">
                  <div className="tie-strength-census__pairs">
                    <AnimatePresence custom={[isForwards]} initial={false}>
                      <Pair
                        key={`${promptIndex}_${stepsState.step}`}
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
                      // Set the max width of the container based on the number of options
                      // This prevents them getting too wide, but also ensures that they
                      // expand to take up all available space.
                      maxWidth: `${(edgeVariableOptions.length + 1) * 20 + 3.6
                        }rem`,
                    }}
                  >
                    <div className="tie-strength-census__options">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={stepsState.step}
                          className="tie-strength-census__options-step"
                          variants={optionsVariants}
                          initial="hide"
                          animate="show"
                          exit="hide"
                        >
                          <div className="form-field-container form-field-boolean">
                            <div className="form-field-boolean__control">
                              <div>
                                <div className="boolean__options">
                                  {edgeVariableOptions.map((option) => (
                                    <BooleanOption
                                      key={option.value}
                                      selected={
                                        !!hasEdge &&
                                        edgeVariableValue === option.value
                                      }
                                      onClick={handleChange(option.value)}
                                      label={option.label}
                                    />
                                  ))}
                                  <BooleanOption
                                    classes="boolean-option--no"
                                    // Has edge is null if not set and false if user rejected
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

TieStrengthCensus.propTypes = {
  stage: PropTypes.object.isRequired,
};

export default TieStrengthCensus
