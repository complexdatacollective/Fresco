import type { Protocol, Stage } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { type Action } from '@reduxjs/toolkit';
import { Locate } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type ThunkDispatch } from 'redux-thunk';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Button from '~/components/ui/Button';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import CollapsablePrompts from '~/lib/interviewer/components/CollapsablePrompts';
import Node from '~/lib/interviewer/components/Node';
import { getAssetUrlFromId } from '~/lib/interviewer/ducks/modules/protocol';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { type RootState } from '~/lib/interviewer/store';
import { useMapbox } from './useMapbox';

type NavDirection = 'forwards' | 'backwards';

const introVariants = {
  show: { opacity: 1, scale: 1 },
  hide: { opacity: 0, scale: 0 },
};

const fadeVariants = {
  show: { opacity: 1, transition: { duration: 0.5 } },
  hide: { opacity: 0, transition: { duration: 0.5 } },
};

const nodeAnimationVariants: Variants = {
  initial: (navDirection: NavDirection) => ({
    opacity: 0,
    y: navDirection === 'backwards' ? '-10%' : '10%',
  }),
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      duration: 0.3,
    },
  },
  exit: (navDirection: NavDirection) => ({
    opacity: 0,
    y: navDirection === 'backwards' ? '10%' : '-10%',
    transition: {
      type: 'tween',
      duration: 0.3,
    },
  }),
};

type GeospatialStage = Extract<
  Protocol['stages'][number],
  { type: 'Geospatial' }
>;

type GeospatialInterfaceProps = Stage & {
  stage: GeospatialStage;
  registerBeforeNext: (
    beforeNext: (direction: NavDirection) => boolean,
  ) => void;
};

export default function GeospatialInterface({
  stage,
  registerBeforeNext,
}: GeospatialInterfaceProps) {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, Action>>();
  const dragSafeRef = useRef(null);

  const [navState, setNavState] = useState({
    activeIndex: 0,
    direction: null as NavDirection | null,
  });
  const [isIntroduction, setIsIntroduction] = useState(true);

  const { mapOptions, introductionPanel } = stage;
  const { promptIndex, prompt: currentPrompt } = usePrompts<{
    variable?: string;
  }>();

  const stageNodes = usePropSelector(getNetworkNodesForType, {
    stage,
  });

  const getAssetUrl = useSelector(getAssetUrlFromId);

  const updateNode = useCallback(
    ({
      nodeId,
      newModelData,
      newAttributeData,
    }: {
      nodeId: string;
      newModelData?: Record<string, unknown>;
      newAttributeData: Record<string, VariableValue>;
    }) =>
      dispatch(updateNodeAction({ nodeId, newModelData, newAttributeData })),
    [dispatch],
  );

  const setLocationValue = (value: string | null) => {
    void updateNode({
      nodeId: stageNodes[navState.activeIndex]![entityPrimaryKeyProperty],
      newAttributeData: {
        [currentPrompt.variable!]: value,
      },
    });
  };

  const initialSelectionValue: string | undefined =
    currentPrompt?.variable && stageNodes[navState.activeIndex]?.attributes
      ? (stageNodes[navState.activeIndex]?.attributes?.[
          currentPrompt.variable
        ] as string | undefined)
      : undefined;

  const { mapContainerRef, handleResetMapZoom, handleResetSelection } =
    useMapbox({
      mapOptions,
      getAssetUrl,
      initialSelectionValue,
      onSelectionChange: (value: string) => {
        if (currentPrompt && stageNodes[navState.activeIndex]) {
          setLocationValue(value);
        }
      },
      show: !isIntroduction,
    });

  const getNodeIndex = useCallback(
    () => navState.activeIndex - 1,
    [navState.activeIndex],
  );

  const isLastNode = useCallback(
    () => navState.activeIndex + 1 >= stageNodes.length,
    [navState.activeIndex, stageNodes.length],
  );

  useEffect(() => {
    setNavState({
      activeIndex: 0,
      direction: null,
    });
  }, [promptIndex]);

  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const handleOutsideSelectableAreas = () => {
    // set the value to 'outside-selectable-areas'
    if (currentPrompt && stageNodes[navState.activeIndex]) {
      setLocationValue('outside-selectable-areas');
    }
  };

  const previousNode = useCallback(() => {
    setNavState({
      activeIndex: getNodeIndex(),
      direction: 'backwards',
    });
    handleResetSelection();
  }, [getNodeIndex, handleResetSelection]);

  const nextNode = useCallback(() => {
    setNavState({
      activeIndex: navState.activeIndex + 1,
      direction: 'forwards',
    });
    handleResetSelection();
  }, [handleResetSelection, navState.activeIndex]);

  const beforeNext = (direction: NavDirection) => {
    // Leave the stage if there are no nodes
    if (stageNodes.length === 0) {
      return true;
    }

    // We are moving backwards.
    if (direction === 'backwards') {
      if (isIntroduction) {
        return true;
      }
      // if we are at the first node, we should go back to introduction
      if (navState.activeIndex === 0) {
        setIsIntroduction(true);
        return false;
      }

      previousNode();
      return false;
    }

    // We are moving forwards.
    if (isIntroduction) {
      setIsIntroduction(false);
      return false;
    }

    if (isLastNode()) {
      handleResetSelection();
      return true;
    }
    nextNode();
    return false;
  };

  registerBeforeNext(beforeNext);

  // Update navigation button based on selection
  useEffect(() => {
    const readyForNext =
      stageNodes[navState.activeIndex]?.attributes?.[currentPrompt.variable!] &&
      !isIntroduction
        ? true
        : false;
    setIsReadyForNext(readyForNext);
  }, [
    currentPrompt.variable,
    isIntroduction,
    navState.activeIndex,
    setIsReadyForNext,
    stageNodes,
  ]);

  if (isIntroduction) {
    return (
      <motion.div
        className="flex flex-1 flex-col items-center justify-center"
        variants={introVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        key="introduction"
      >
        <div className="max-w-3xl rounded-lg bg-(--nc-panel-bg-muted) p-8">
          <h1 className="text-center">{introductionPanel?.title}</h1>
          <RenderMarkdown>{introductionPanel?.text}</RenderMarkdown>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="w-full items-center justify-center"
        ref={dragSafeRef}
        variants={fadeVariants}
        initial="hide"
        animate="show"
        exit="hide"
        key="geospatial-interface"
      >
        {/* if outside-selectable-areas, add an overlay */}
        {initialSelectionValue === 'outside-selectable-areas' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-(--nc-background) opacity-75" />
            <div className="relative z-20 flex w-1/3 flex-col items-center gap-6 text-center">
              <h2>
                You have indicated an area outside of the selectable map. If
                this is correct, please select the down arrow to proceed.
              </h2>
              <Button
                size="sm"
                onClick={() => {
                  setLocationValue(null);
                }}
              >
                Deselect
              </Button>
            </div>
          </div>
        )}

        <div
          id="map-container"
          className="h-full w-full"
          ref={mapContainerRef}
        />

        <div className="absolute bottom-10 left-14 z-5">
          <Button
            size="lg"
            onClick={handleResetMapZoom}
            icon={<Locate />}
            title="Recenter Map"
          />
        </div>

        <CollapsablePrompts
          currentPromptIndex={promptIndex}
          dragConstraints={dragSafeRef}
        >
          <div className="flex flex-col items-center gap-2 pb-4">
            <motion.div
              key={stageNodes[navState.activeIndex]?.[entityPrimaryKeyProperty]}
              variants={nodeAnimationVariants}
              custom={navState.direction}
              initial="initial"
              animate="animate"
              exit="exit"
              className="[--base-node-size:calc(var(--nc-base-font-size)*6.6)]"
            >
              <Node {...stageNodes[navState.activeIndex]!} />
            </motion.div>
            <Button
              size="sm"
              color="primary"
              onClick={handleOutsideSelectableAreas}
              disabled={initialSelectionValue === 'outside-selectable-areas'}
            >
              Outside Selectable Areas
            </Button>
          </div>
        </CollapsablePrompts>
      </motion.div>
    </AnimatePresence>
  );
}
