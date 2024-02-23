import React, { useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import BooleanOption from '~/lib/ui/components/Boolean/BooleanOption';
import { AnimatePresence, motion } from 'framer-motion';
import { Markdown } from '~/lib/ui/components/Fields';
import Prompts from '../../../components/Prompts';
import { usePrompts } from '../../../behaviours/withPrompt';
import { getNetworkNodesForType } from '../../../selectors/interface';
import { getEdgeColor, getNetworkEdges as getEdges } from '../../../selectors/network';
import { getPairs, getNodePair } from './helpers';
import Pair from './Pair';
import { get } from '../../../utils/lodash-replacements';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import useAutoAdvance from '../DyadCensus/useAutoAdvance';
import useSteps from '../DyadCensus/useSteps';
import useEdgeState from '../DyadCensus/useEdgeState';
import { getProtocolCodebook } from '~/lib/interviewer/selectors/protocol';

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
    getNavigationHelpers,
  } = props;

  const {
    moveForward,
  } = getNavigationHelpers();

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [isValid, setIsValid] = useState(true);

  const {
    promptIndex,
    prompt: {
      createEdge,
      edgeVariable,
      negativeLabel
    },
    prompts
  } = usePrompts();

  const nodes = usePropSelector(getNetworkNodesForType, props);
  const edges = usePropSelector(getEdges, props);
  const edgeColor = usePropSelector(getEdgeColor, {
    type: createEdge
  })

  const codebook = usePropSelector(getProtocolCodebook, props);
  const edgeVariableOptions = get(codebook, ['edge', createEdge, 'variables', edgeVariable, 'options'], []);

  const pairs = getPairs(nodes);



  // Number of pairs times number of prompts e.g. `[3, 3, 3]`
  const steps = Array(prompts.length).fill(get(pairs, 'length', 0));
  const [stepsState, nextStep, previousStep] = useSteps(steps);

  const pair = get(pairs, stepsState.substep, null);
  const [fromNode, toNode] = getNodePair(nodes, pair);

  // hasEdge:
  //  - false: user denied
  //  - null: not yet decided
  //  - true: edge exists
  const { hasEdge, edgeVariableValue, setEdge, isTouched, isChanged } =
    useEdgeState(
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
        // IMPORTANT! `next()` needs to be called still, so that the useSteps
        // state reflects the change in substep! Alternatively it could be
        // refactored to use the prompt index in place of the step.
        nextStep();
        return true; // Advance the prompt or the stage as appropriate
      }

      nextStep();
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
        // IMPORTANT! `back()` needs to be called still, so that the useSteps
        // state reflects the change in substep! Alternatively it could be 
        // refactored to use the prompt index in place of the step.
        previousStep();
        return true; // Go back to the previous prompt
      }

      previousStep();
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
