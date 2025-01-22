import {
  entityPrimaryKeyProperty,
  type NcNode,
  type Stage,
} from '@codaco/shared-consts';
import { type Action } from '@reduxjs/toolkit';
import { Locate } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type ThunkDispatch } from 'redux-thunk';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import CollapsablePrompts from '~/lib/interviewer/components/CollapsablePrompts';
import Node from '~/lib/interviewer/components/Node';
import { actionCreators as sessionActions } from '~/lib/interviewer/ducks/modules/session';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/interface';
import { getAssetUrlFromId } from '~/lib/interviewer/selectors/protocol';
import { type RootState } from '~/lib/interviewer/store';
import type { Protocol } from '~/lib/protocol-validation/schemas/src/8.zod';
import { ActionButton } from '~/lib/ui/components';
import Button from '~/lib/ui/components/Button';
import { useMapbox } from './useMapbox';

type NavDirection = 'forwards' | 'backwards';

const NodeAnimationVariants = {
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
  getNavigationHelpers: () => {
    moveForward: () => void;
  };
};

export default function GeospatialInterface({
  stage,
  registerBeforeNext,
  getNavigationHelpers,
}: GeospatialInterfaceProps) {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, Action>>();
  const dragSafeRef = useRef(null);

  const [navState, setNavState] = useState({
    activeIndex: 0,
    direction: null as NavDirection | null,
  });

  const { mapOptions } = stage;
  const { promptIndex, prompt: currentPrompt } = usePrompts();

  const stageNodes = usePropSelector(getNetworkNodesForType, {
    stage,
  }) as NcNode[];

  const getAssetUrl = useSelector(getAssetUrlFromId);

  const updateNode = useCallback(
    (
      nodeId: string,
      newModelData: Record<string, unknown>,
      newAttributes: Record<string, unknown>,
    ) =>
      dispatch(sessionActions.updateNode(nodeId, newModelData, newAttributes)),
    [dispatch],
  );

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
          updateNode(
            stageNodes[navState.activeIndex]?.[entityPrimaryKeyProperty] ?? '',
            {},
            {
              [currentPrompt.variable!]: value,
            },
          );
        }
      },
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

  const { moveForward } = getNavigationHelpers();

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
      // if we are at the first node, we should leave the stage
      if (navState.activeIndex === 0) {
        return true;
      }

      previousNode();
      return false;
    }

    // We are moving forwards.
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
      currentPrompt?.variable && stageNodes[navState.activeIndex]
        ? !!(stageNodes[navState.activeIndex] as Record<string, unknown>)[
            currentPrompt.variable
          ]
        : false;
    setIsReadyForNext(readyForNext);
  }, [
    currentPrompt.variable,
    navState.activeIndex,
    setIsReadyForNext,
    stageNodes,
  ]);

  return (
    <div className="w-full items-center justify-center" ref={dragSafeRef}>
      <div id="map-container" className="h-full w-full" ref={mapContainerRef} />

      <div className="absolute bottom-10 left-14 z-10">
        <ActionButton
          onClick={handleResetMapZoom}
          icon={<Locate />}
          title="Reset Map"
          showPlusButton={false}
        />
      </div>

      <CollapsablePrompts
        currentPromptIndex={promptIndex}
        dragConstraints={dragSafeRef}
      >
        <div className="flex flex-col items-center gap-2 pb-4">
          <AnimatePresence
            mode="wait"
            key={currentPrompt?.id}
            custom={navState.direction}
          >
            <motion.div
              key={stageNodes[navState.activeIndex]?.[entityPrimaryKeyProperty]}
              variants={NodeAnimationVariants}
              custom={navState.direction}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Node
                {...stageNodes[navState.activeIndex]}
                style={{ fontSize: `calc(var(--nc-base-font-size) * 8)` }}
              />
            </motion.div>
          </AnimatePresence>
          <Button
            size="small"
            color="navy-taupe"
            onClick={moveForward}
            disabled={!!initialSelectionValue}
          >
            Skip
          </Button>
        </div>
      </CollapsablePrompts>
    </div>
  );
}
