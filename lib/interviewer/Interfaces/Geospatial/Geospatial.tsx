import {
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { type Action } from '@reduxjs/toolkit';
import { LocateFixed, TrainFront, ZoomIn, ZoomOut } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type ThunkDispatch } from 'redux-thunk';
import Surface from '~/components/layout/Surface';
import Button, { IconButton } from '~/components/ui/Button';
import Node from '~/lib/interviewer/components/Node';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { getAssetUrlFromId } from '~/lib/interviewer/ducks/modules/protocol';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import GeospatialSearch from '~/lib/interviewer/Interfaces/Geospatial/GeospatialSearch';
import CollapsablePrompts from '~/lib/interviewer/Interfaces/Sociogram/CollapsablePrompts';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { type RootState } from '~/lib/interviewer/store';
import { type Direction, type StageProps } from '~/lib/interviewer/types';
import { useMapbox } from '~/lib/interviewer/Interfaces/Geospatial/useMapbox';

const fadeVariants = {
  show: { opacity: 1, transition: { duration: 0.5 } },
  hide: { opacity: 0, transition: { duration: 0.5 } },
};

const nodeAnimationVariants: Variants = {
  initial: (navDirection: Direction) => ({
    opacity: 0,
    y: navDirection === 'backwards' ? '-20%' : '20%',
  }),
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ease: 'easeInOut',
      duration: 0.4,
    },
  },
  exit: (navDirection: Direction) => ({
    opacity: 0,
    y: navDirection === 'backwards' ? '20%' : '-20%',
    transition: {
      ease: 'easeInOut',
      duration: 0.4,
    },
  }),
};

type GeospatialInterfaceProps = StageProps<'Geospatial'>;

export default function GeospatialInterface({
  stage,
}: GeospatialInterfaceProps) {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, Action>>();
  const dragSafeRef = useRef(null);

  const [navState, setNavState] = useState<{
    activeIndex: number;
    direction: Direction | null;
  }>({
    activeIndex: 0,
    direction: null,
  });

  const { mapOptions } = stage;
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

  const {
    mapContainerRef,
    mapRef,
    accessToken,
    handleResetMapZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetSelection,
    handleToggleTransitLayers,
    transitLayersVisible,
  } = useMapbox({
    mapOptions,
    getAssetUrl,
    initialSelectionValue,
    onSelectionChange: (value: string) => {
      if (currentPrompt && stageNodes[navState.activeIndex]) {
        setLocationValue(value);
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

  const beforeNext = (direction: Direction) => {
    // Leave the stage if there are no nodes
    if (stageNodes.length === 0) {
      return true;
    }

    // We are moving backwards.
    if (direction === 'backwards') {
      // If we are at the first node, leave the stage
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

  useBeforeNext(beforeNext);

  // Update navigation button based on selection
  useEffect(() => {
    const readyForNext =
      !!stageNodes[navState.activeIndex]?.attributes?.[currentPrompt.variable!];
    setIsReadyForNext(readyForNext);
  }, [
    currentPrompt.variable,
    navState.activeIndex,
    setIsReadyForNext,
    stageNodes,
  ]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="flex size-full flex-col"
        ref={dragSafeRef}
        variants={fadeVariants}
        initial="hide"
        animate="show"
        exit="hide"
        key="geospatial-interface"
      >
        <div className="relative size-full">
          {/* if outside-selectable-areas, add an overlay */}
          {initialSelectionValue === 'outside-selectable-areas' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="bg-background absolute inset-0 opacity-75" />
              <div className="relative z-20 flex w-1/3 flex-col items-center gap-6 text-center">
                <h2>
                  You have indicated an area outside of the selectable map. If
                  this is correct, please select the next arrow to proceed.
                </h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setLocationValue(null);
                  }}
                  color="primary"
                >
                  Deselect
                </Button>
              </div>
            </div>
          )}

          <div id="map-container" className="size-full" ref={mapContainerRef} />

          {/* Search - top left */}
          <div className="absolute top-4 left-4 z-5">
            <GeospatialSearch
              accessToken={accessToken}
              map={mapRef.current}
              proximity={mapOptions.center}
              resetKey={navState.activeIndex}
            />
          </div>

          {/* Map toolbar - zoom controls */}
          <Surface
            noContainer
            level={0}
            spacing="none"
            elevation="none"
            className="absolute right-4 bottom-10 z-5 flex flex-col gap-2 rounded-xl p-2"
          >
            <IconButton
              onClick={handleZoomIn}
              icon={<ZoomIn />}
              aria-label="Zoom In"
              color="default"
            />
            <IconButton
              onClick={handleZoomOut}
              icon={<ZoomOut />}
              aria-label="Zoom Out"
              color="default"
            />
            <IconButton
              onClick={handleResetMapZoom}
              icon={<LocateFixed />}
              aria-label="Recenter Map"
              color="default"
            />
            <IconButton
              data-testid="geospatial-transit-toggle"
              onClick={handleToggleTransitLayers}
              icon={<TrainFront />}
              aria-label={
                transitLayersVisible
                  ? 'Hide Transit Lines'
                  : 'Show Transit Lines'
              }
              color={transitLayersVisible ? 'success' : 'default'}
            />
          </Surface>
        </div>

        <CollapsablePrompts
          currentPromptIndex={promptIndex}
          dragConstraints={dragSafeRef}
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              key={stageNodes[navState.activeIndex]?.[entityPrimaryKeyProperty]}
              variants={nodeAnimationVariants}
              custom={navState.direction}
              initial="initial"
              animate="animate"
              exit="exit"
              className="[--base-node-size:calc(var(--nc-base-font-size)*6.6)]"
            >
              {stageNodes[navState.activeIndex] && (
                <Node size="sm" {...stageNodes[navState.activeIndex]!} />
              )}
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
