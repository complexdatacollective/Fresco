import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { type AnyAction } from '@reduxjs/toolkit';
import { Locate } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type ThunkDispatch } from 'redux-thunk';
import type { Protocol } from '~/lib/protocol-validation/schemas/src/8.zod';
import Button from '~/lib/ui/components/Button';
import { usePrompts } from '../../../behaviours/withPrompt';
import CollapsablePrompts from '../../../components/CollapsablePrompts';
import Node from '../../../components/Node';
import { actionCreators as sessionActions } from '../../../ducks/modules/session';
import usePropSelector from '../../../hooks/usePropSelector';
import useReadyForNextStage from '../../../hooks/useReadyForNextStage';
import { getNetworkNodesForType } from '../../../selectors/interface';
import { getAssetUrlFromId } from '../../../selectors/protocol';
import { type RootState } from '../../../store';
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

type GeospatialInterfaceProps = {
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
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, AnyAction>>();
  const dragSafeRef = useRef(null);

  const [navState, setNavState] = useState({
    activeIndex: 0,
    direction: null as NavDirection | null,
  });

  const { prompts, mapOptions } = stage;
  const { promptIndex } = usePrompts();
  const currentPrompt = prompts[promptIndex];
  if (!currentPrompt) {
    throw new Error('Prompt not found');
  }
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
              [currentPrompt.variable]: value,
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
        <Button onClick={handleResetMapZoom} icon={<Locate size={24} />} />
      </div>

      <CollapsablePrompts
        currentPromptIndex={currentPrompt ? prompts.indexOf(currentPrompt) : -1}
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
