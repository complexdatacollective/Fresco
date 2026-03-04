import {
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { SearchBox } from '@mapbox/search-js-react';
import { type Action } from '@reduxjs/toolkit';
import { LocateFixed, Search, TrainFront, ZoomIn, ZoomOut } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import CollapsablePrompts from '~/lib/interviewer/Interfaces/Sociogram/CollapsablePrompts';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { type RootState } from '~/lib/interviewer/store';
import { type Direction, type StageProps } from '~/lib/interviewer/types';
import {
  convertCssColorToHex,
  useMapbox,
} from '~/lib/interviewer/Interfaces/Geospatial/useMapbox';

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

  // Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Theme for Mapbox SearchBox - compute colors from CSS variables
  const searchBoxTheme = useMemo(() => {
    if (typeof document === 'undefined') return {};

    const styles = getComputedStyle(document.documentElement);
    const getColor = (varName: string) =>
      convertCssColorToHex(styles.getPropertyValue(varName).trim());

    return {
      variables: {
        fontFamily: 'inherit',
        unit: '14px',
        padding: '0.5em',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
        colorBackground: getColor('--color-background'),
        colorBackgroundHover: getColor('--color-surface-1'),
        colorBackgroundActive: getColor('--color-surface-2'),
        colorText: getColor('--color-text'),
        colorPrimary: getColor('--color-primary'),
        border: `1px solid ${getColor('--color-border')}`,
      },
    };
  }, []);

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
    setSearchValue('');
  }, [getNodeIndex, handleResetSelection]);

  const nextNode = useCallback(() => {
    setNavState({
      activeIndex: navState.activeIndex + 1,
      direction: 'forwards',
    });
    handleResetSelection();
    setSearchValue('');
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

          {/* Search box - toggleable from toolbar */}
          <AnimatePresence>
            {searchVisible && accessToken && mapRef.current && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute top-4 left-4 z-10 w-80 **:text-(--color-text)!"
              >
                <SearchBox
                  accessToken={accessToken}
                  map={mapRef.current}
                  mapboxgl={mapboxgl}
                  value={searchValue}
                  onChange={(value) => setSearchValue(value)}
                  options={{
                    proximity: mapOptions.center,
                  }}
                  placeholder="Search for a place or address..."
                  theme={searchBoxTheme}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map toolbar */}
          <Surface
            noContainer
            level={0}
            spacing="none"
            elevation="none"
            className="absolute right-4 bottom-10 z-5 flex flex-col gap-2 rounded-xl p-2"
          >
            <IconButton
              data-testid="geospatial-search-toggle"
              onClick={() => setSearchVisible((v) => !v)}
              icon={<Search />}
              aria-label={searchVisible ? 'Close Search' : 'Search Location'}
              color={searchVisible ? 'success' : 'primary'}
            />
            <IconButton
              onClick={handleZoomIn}
              icon={<ZoomIn />}
              aria-label="Zoom In"
              color="primary"
            />
            <IconButton
              onClick={handleZoomOut}
              icon={<ZoomOut />}
              aria-label="Zoom Out"
              color="primary"
            />
            <IconButton
              onClick={handleResetMapZoom}
              icon={<LocateFixed />}
              aria-label="Recenter Map"
              color="primary"
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
              color={transitLayersVisible ? 'success' : 'primary'}
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
