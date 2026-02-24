import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import BooleanField from '~/lib/form/components/fields/Boolean';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import {
  addEdge,
  type DyadCensusMetadataItem,
  deleteEdge,
  edgeExists,
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
import Pair from './components/Pair';
import {
  getNodePair,
  getStageMetadataResponse,
  isDyadCensusMetadata,
  matchEntry,
} from './helpers';

const choiceVariants = {
  initial: { opacity: 0, translateY: '120%' },
  animate: {
    opacity: 1,
    translateY: '0%',
    transition: { delay: 0.15, type: 'spring' as const },
  },
  exit: { opacity: 0, translateY: '120%' },
};

const introVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
};

type DyadCensusProps = StageProps<'DyadCensus'>;

export default function DyadCensus(props: DyadCensusProps) {
  const { stage, getNavigationHelpers } = props;
  const { moveForward } = getNavigationHelpers();
  const dispatch = useAppDispatch();

  const [isIntroduction, setIsIntroduction] = useState(true);
  const [pairIndex, setPairIndex] = useState(0);

  const {
    promptIndex,
    prompt: { createEdge },
  } = usePrompts<(typeof stage.prompts)[number]>();

  const nodes = useSelector(getNetworkNodesForType);
  const edges = useSelector(getNetworkEdges);
  const edgeColor = useSelector(getEdgeColorForType(createEdge));
  const stageMetadata = useSelector(getStageMetadata);
  const pairs = useSelector(getNodePairs);

  const pair =
    pairIndex >= 0 && pairIndex < pairs.length
      ? (pairs[pairIndex] ?? null)
      : null;
  const [fromNode, toNode] = getNodePair(nodes, pair);

  // Compute edge state directly from Redux
  const existingEdgeId =
    (pair && edgeExists(edges, pair[0], pair[1], createEdge)) ?? false;
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
  const setEdge = (value: boolean | undefined) => {
    if (!pair || value === undefined) return;

    setIsChanged(hasEdge !== value);
    setIsTouched(true);

    if (value === true) {
      void dispatch(addEdge({ from: pair[0], to: pair[1], type: createEdge }));

      if (isDyadCensusMetadata(stageMetadata)) {
        dispatch(
          updateStageMetadata(
            stageMetadata.filter(
              (item) => !matchEntry(promptIndex, pair)(item),
            ),
          ),
        );
      } else {
        dispatch(updateStageMetadata([] as DyadCensusMetadataItem[]));
      }
      return;
    }

    // value === false
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
  };

  return (
    <div className="interface flex flex-1 flex-col items-center justify-center">
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
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
            }}
            initial="initial"
            exit="exit"
            animate="animate"
            className="flex w-full flex-1 flex-col items-center"
          >
            <motion.div className="flex w-full grow flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <Pair
                  key={`${promptIndex}_${pairIndex}`}
                  fromNode={fromNode}
                  toNode={toNode}
                  edgeColor={edgeColor}
                  hasEdge={hasEdge}
                />
              </AnimatePresence>
            </motion.div>
            <AnimatePresence mode="wait">
              <MotionSurface
                noContainer
                key={promptIndex}
                className="flex size-fit shrink-0 grow-0 flex-col items-center justify-center gap-4"
                variants={choiceVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Prompts />
                <AnimatePresence>
                  <motion.div
                    key={`${promptIndex}_${pairIndex}_choice`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <BooleanField
                      className="w-fit"
                      value={hasEdge ?? undefined}
                      onChange={setEdge}
                      options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                      ]}
                      noReset
                    />
                  </motion.div>
                </AnimatePresence>
              </MotionSurface>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
