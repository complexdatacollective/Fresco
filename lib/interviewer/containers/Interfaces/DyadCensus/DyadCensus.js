import cx from 'classnames';
import { get } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import Prompts from '~/lib/interviewer/components/Prompts';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import {
  getEdgeColor,
  getNetworkEdges,
  getNetworkNodesForType,
} from '~/lib/interviewer/selectors/session';
import BooleanOption from '~/lib/ui/components/Boolean/BooleanOption';
import { Markdown } from '~/lib/ui/components/Fields';
import { getNodePair, getPairs } from './helpers';
import Pair from './Pair';
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
  const { registerBeforeNext, stage, getNavigationHelpers } = props;

  const { moveForward } = getNavigationHelpers();

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [isValid, setIsValid] = useState(true);

  const {
    prompt: { createEdge },
    promptIndex,
    prompts,
  } = usePrompts();

  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getNetworkEdges, props);
  const edgeColor = usePropSelector(getEdgeColor, {
    type: createEdge,
  });

  const pairs = getPairs(nodes);
  // Number of pairs times number of prompts e.g. `[3, 3, 3]`
  const steps = Array(prompts.length).fill(get(pairs, 'length', 0));

  const [stepsState, nextStep, previousStep] = useSteps(steps);

  const pair = get(pairs, stepsState.substep, null);

  const [fromNode, toNode] = getNodePair(nodes, pair);

  const { hasEdge, setEdge, isTouched, isChanged } = useEdgeState(
    pair,
    edges,
    `${stepsState.step}_${stepsState.substep}`,
  );

  registerBeforeNext(async (direction) => {
    if (direction === 'forwards') {
      setForwards(true);
      setIsValid(true);

      if (isIntroduction) {
        // If there are no steps, clicking next should move to the next stage
        if (stepsState.totalSteps === 0) {
          return 'FORCE';
        }

        setIsIntroduction(false);
        return false;
      }

      // check value has been set
      if (hasEdge === null) {
        setIsValid(false);
        return false; // don't move to next stage
      }

      if (stepsState.isStepEnd || stepsState.isEnd) {
        // IMPORTANT! `nextStep()` needs to be called still, so that the useSteps
        // state reflects the change in substep! Alternatively it could be
        // refactored to use the prompt index in place of the step.
        nextStep();
        return true; // Advance the prompt or the stage as appropriate
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
        setIsIntroduction(true); // Go back to the introduction
        return false;
      }

      if (stepsState.isStepStart) {
        // IMPORTANT! `previousStep()` needs to be called still, so that the useSteps
        // state reflects the change in substep! Alternatively it could be
        // refactored to use the prompt index in place of the step.
        previousStep();
        return true; // Go back to the previous prompt
      }

      previousStep();
      return false;
    }
  });

  useAutoAdvance(moveForward, isTouched, isChanged);

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
