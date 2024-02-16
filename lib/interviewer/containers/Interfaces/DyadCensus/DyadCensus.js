import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import BooleanOption from '~/lib/ui/components/Boolean/BooleanOption';
import { AnimatePresence, motion } from 'framer-motion';
import { Markdown } from '~/lib/ui/components/Fields';
import Prompts from '../../../components/Prompts';
import { usePrompts } from '../../../behaviours/withPrompt';
import { getEdgeColor, getNetworkEdges } from '../../../selectors/network';
import { getPairs, getNodePair } from './helpers';
import useSteps from './useSteps';
import useNetworkEdgeState from './useEdgeState';
import useAutoAdvance from './useAutoAdvance';
import Pair from './Pair';
import { get } from '../../../utils/lodash-replacements';
import { useNavigationHelpers } from '~/lib/interviewer/hooks/useNavigationHelpers';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/interface';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';

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
    transition: { delay: 0.15, type: 'spring' },
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
const DyadCensus = (props) => {
  const {
    registerBeforeNext,
    stage,
  } = props;

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [isValid, setIsValid] = useState(true);

  const {
    moveBackward,
    moveForward,
    currentStage,
  } = useNavigationHelpers();

  const {
    prompt,
    promptIndex,
  } = usePrompts();

  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getNetworkEdges, props);
  const edgeColor = usePropSelector(getEdgeColor, {
    type: prompt?.createEdge
  });
  const pairs = getPairs(nodes);

  // Number of pairs times number of prompts e.g. `[3, 3, 3]`
  const steps = Array(stage.prompts.length).fill(get(pairs, 'length', 0));
  const [stepsState, nextStep, previousStep] = useSteps(steps);

  const pair = get(pairs, stepsState.substep, null);
  const [fromNode, toNode] = getNodePair(nodes, pair);



  const [hasEdge, setEdge, isTouched, isChanged] = useNetworkEdgeState(
    edges,
    prompt?.createEdge, // Type of edge to create
    pair,
    prompt.id,
    currentStage,
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

    // check value has been set
    if (hasEdge === null) {
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
  }, [registerBeforeNext, beforeNext]);

  useAutoAdvance(next, isTouched, isChanged);

  const handleChange = (nextValue) => () => {
    // 'debounce' clicks, one click (isTouched) should start auto-advance
    // so ignore further clicks
    if (isTouched) {
      return;
    }
    setEdge(nextValue);
  };

  const choiceClasses = cx('dyad-census__choice', {
    'dyad-census__choice--invalid': !isValid,
  });

  return (
    <div className="dyad-census">
      <AnimatePresence initial={false} mode="wait">
        {isIntroduction && (
          <motion.div
            className="dyad-census__introduction"
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
            className="dyad-census__wrapper"
          >
            <div className="dyad-census__prompt">
              <Prompts />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                className="dyad-census__main"
                key={promptIndex}
                variants={fadeVariants}
                initial="hide"
                exit="hide"
                animate="show"
              >
                <div className="dyad-census__layout">
                  <div className="dyad-census__pairs">
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
                    layout
                    initial="hide"
                    animate="show"
                  >
                    <div className="dyad-census__options">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={stepsState.step}
                          className="dyad-census__options-step"
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
};

DyadCensus.propTypes = {
  stage: PropTypes.object.isRequired,
};

export default DyadCensus;

