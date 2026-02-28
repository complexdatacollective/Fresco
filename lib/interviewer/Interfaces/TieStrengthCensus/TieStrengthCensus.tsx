'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import BooleanOption from '~/lib/interviewer/components/BooleanOption';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import {
  addEdge,
  type DyadCensusMetadataItem,
  deleteEdge,
  edgeExists,
  updateEdge,
  updateStageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import useStageValidation from '~/lib/interviewer/hooks/useStageValidation';
import {
  getEdgeColorForType,
  getNetworkEdges,
  getNetworkNodesForType,
  getStageMetadata,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import { getNodePairs } from '../../selectors/dyad-census';
import {
  getNodePair,
  getStageMetadataResponse,
  isDyadCensusMetadata,
  matchEntry,
} from '../DyadCensus/helpers';
import Pair from './Pair';

const fadeVariants = {
  initial: { opacity: 0, transition: { duration: 0.5 } },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};

const optionsVariants = {
  initial: { opacity: 0, transition: { delay: 0.35, duration: 0.25 } },
  animate: { opacity: 1, transition: { delay: 0.35, duration: 0.25 } },
  exit: { opacity: 0, transition: { delay: 0.35, duration: 0.25 } },
};

const choiceVariants = {
  initial: { opacity: 0, translateY: '120%' },
  animate: {
    opacity: 1,
    translateY: '0%',
    transition: { delay: 0.25, type: 'spring' as const },
  },
  exit: { opacity: 0, translateY: '120%' },
};

const introVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
};

type TieStrengthCensusProps = StageProps<'TieStrengthCensus'>;

export default function TieStrengthCensus(props: TieStrengthCensusProps) {
  const { stage, getNavigationHelpers } = props;
  const { moveForward } = getNavigationHelpers();
  const dispatch = useAppDispatch();

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [isForwards, setForwards] = useState(true);
  const [pairIndex, setPairIndex] = useState(0);

  const {
    promptIndex,
    prompt: { createEdge, edgeVariable, negativeLabel },
  } = usePrompts<{
    createEdge: string;
    edgeVariable?: string;
    negativeLabel: string;
  }>();

  const nodes = useSelector(getNetworkNodesForType);
  const edges = useSelector(getNetworkEdges);
  const edgeColor = useSelector(getEdgeColorForType(createEdge));
  const stageMetadata = useSelector(getStageMetadata);
  const codebook = useSelector(getCodebook);
  const pairs = useSelector(getNodePairs);

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

  const pair =
    pairIndex >= 0 && pairIndex < pairs.length
      ? (pairs[pairIndex] ?? null)
      : null;
  const [fromNode, toNode] = getNodePair(nodes, pair);

  // Compute edge state directly from Redux
  const existingEdgeId =
    (pair && edgeExists(edges, pair[0], pair[1], createEdge)) ?? false;

  const edgeVariableValue = (() => {
    if (!edgeVariable || !existingEdgeId) return undefined;
    const edge = edges.find(
      (e) => e[entityPrimaryKeyProperty] === existingEdgeId,
    );
    return edge?.[entityAttributesProperty]?.[edgeVariable] ?? undefined;
  })();

  const metadataResponse = pair
    ? getStageMetadataResponse(stageMetadata, promptIndex, pair)
    : { exists: false, value: undefined };

  const hasEdge: boolean | null = existingEdgeId
    ? true
    : metadataResponse.exists
      ? false
      : null;

  // Auto-advance tracking
  const [isTouched, setIsTouched] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  // Reset touch state when pair or prompt changes
  useEffect(() => {
    setIsTouched(false);
    setIsChanged(false);
  }, [pairIndex, promptIndex]);

  // Validation
  useStageValidation({
    constraints: [
      {
        direction: 'forwards',
        isMet: isIntroduction || hasEdge !== null,
        toast: {
          description: 'Please select a response before continuing.',
          variant: 'destructive',
          anchor: 'forward',
        },
      },
    ],
  });

  // Navigation
  useBeforeNext((direction) => {
    if (direction === 'forwards') {
      setForwards(true);

      if (isIntroduction) {
        if (pairs.length === 0) {
          return 'FORCE';
        }
        setIsIntroduction(false);
        return false;
      }

      const isLastPair = pairIndex === pairs.length - 1;
      if (isLastPair) {
        setPairIndex(0);
        return true;
      }

      setPairIndex((i) => i + 1);
      return false;
    }

    if (direction === 'backwards') {
      setForwards(false);

      if (isIntroduction) {
        return true;
      }

      if (pairIndex > 0) {
        setPairIndex((i) => i - 1);
        return false;
      }

      // pairIndex === 0
      if (promptIndex === 0) {
        setIsIntroduction(true);
        return false;
      }

      setPairIndex(pairs.length - 1);
      return true;
    }

    return false;
  });

  // Auto-advance
  const moveForwardRef = useRef(moveForward);
  moveForwardRef.current = moveForward;

  useEffect(() => {
    if (!isTouched) return;

    if (!isChanged) {
      moveForwardRef.current();
      return;
    }

    const timer = setTimeout(() => {
      moveForwardRef.current();
    }, 350);

    return () => clearTimeout(timer);
  }, [isTouched, isChanged]);

  // Edge state management
  const setEdge = (value: boolean | string | number) => {
    if (!pair) return;

    setIsChanged(hasEdge !== value);
    setIsTouched(true);

    if (value === false) {
      if (existingEdgeId) {
        dispatch(deleteEdge(existingEdgeId));
      }

      const existingMetadata = isDyadCensusMetadata(stageMetadata)
        ? stageMetadata.filter((item) => !matchEntry(promptIndex, pair)(item))
        : [];

      dispatch(
        updateStageMetadata([
          ...existingMetadata,
          [promptIndex, ...pair, value],
        ] as DyadCensusMetadataItem[]),
      );
      return;
    }

    // value is string | number — create or update edge with variable value
    if (typeof value === 'string' || typeof value === 'number') {
      if (isDyadCensusMetadata(stageMetadata)) {
        dispatch(
          updateStageMetadata(
            stageMetadata.filter(
              (item) => !matchEntry(promptIndex, pair)(item),
            ),
          ),
        );
      }

      if (existingEdgeId) {
        void dispatch(
          updateEdge({
            edgeId: existingEdgeId,
            newAttributeData: {
              [edgeVariable!]: value,
            },
          }),
        );
      } else {
        void dispatch(
          addEdge({
            from: pair[0],
            to: pair[1],
            type: createEdge,
            attributeData: {
              [edgeVariable!]: value,
            },
          }),
        );
      }
    }
  };

  const handleChange = (nextValue: boolean | string | number) => () => {
    if (isTouched) return;
    setEdge(nextValue);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <AnimatePresence initial={false} mode="wait">
        {isIntroduction ? (
          <MotionSurface
            noContainer
            className="w-full max-w-2xl grow-0"
            variants={introVariants}
            initial="initial"
            exit="exit"
            animate="animate"
            key="intro"
          >
            <Heading level="h1" className="text-center">
              {stage.introductionPanel.title}
            </Heading>
            <RenderMarkdown>{stage.introductionPanel.text}</RenderMarkdown>
          </MotionSurface>
        ) : (
          <motion.div
            key="content"
            variants={fadeVariants}
            initial="initial"
            exit="exit"
            animate="animate"
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
                initial="initial"
                exit="exit"
                animate="animate"
              >
                <div className="absolute top-0 left-0 flex size-full flex-col items-center justify-center">
                  <div className="relative flex w-full grow items-center justify-center">
                    <AnimatePresence custom={[isForwards]} initial={false}>
                      <Pair
                        key={`${promptIndex}_${pairIndex}`}
                        edgeColor={edgeColor}
                        hasEdge={hasEdge}
                        animateForwards={isForwards}
                        fromNode={fromNode}
                        toNode={toNode}
                      />
                    </AnimatePresence>
                  </div>
                  <motion.div
                    className="relative z-(--z-panel) flex w-full min-w-[65vmin] grow-0 flex-col rounded-(--nc-border-radius) border-8 border-transparent p-5"
                    variants={choiceVariants}
                    initial="initial"
                    animate="animate"
                    style={{
                      maxWidth: `${(edgeVariableOptions.length + 1) * 20 + 3.6}rem`,
                    }}
                  >
                    <div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={promptIndex}
                          className="flex items-center justify-center"
                          variants={optionsVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
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
}
