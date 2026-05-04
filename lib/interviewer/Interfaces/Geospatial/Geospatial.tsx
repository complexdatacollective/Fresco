import {
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { type Action } from '@reduxjs/toolkit';
import { LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';
import { type ExtendedMapOptions } from '~/lib/interviewer/Interfaces/Geospatial/useMapbox';
// import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { type ThunkDispatch } from 'redux-thunk';
import { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import Button, { IconButton } from '@codaco/fresco-ui/Button';
import Node from '~/lib/interviewer/components/ConnectedNode';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { useContractFlags } from '~/lib/interviewer/contract/context';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { useAssetUrl } from '~/lib/interviewer/hooks/useAssetUrl';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { isMapboxStubBrowser } from '~/lib/interviewer/Interfaces/Geospatial/isMapboxStubBrowser';
import { useMapbox } from '~/lib/interviewer/Interfaces/Geospatial/useMapbox';
import CollapsablePrompts from '~/lib/interviewer/Interfaces/Sociogram/CollapsablePrompts';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { type RootState } from '~/lib/interviewer/store';
import { type Direction, type StageProps } from '~/lib/interviewer/types';

// Dynamic import with ssr:false - @mapbox/search-js-web accesses document at module load
const GeospatialSearch = dynamic(
  () => import('~/lib/interviewer/Interfaces/Geospatial/GeospatialSearch'),
  { ssr: false },
);

// Dynamic import keeps the stub out of production bundles. The stub is only
// reachable when isE2E && isMapboxStubBrowser() — gated at the JSX level.
const GeospatialStubSearch = dynamic(
  () => import('~/lib/interviewer/Interfaces/Geospatial/GeospatialStubSearch'),
  { ssr: false },
);

const STUB_ZOOM_STEP = 1;

const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, when: 'beforeChildren' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, when: 'beforeChildren' },
  },
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

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readFirstFeatureProperty(json: unknown, property: string): unknown {
  if (!isUnknownRecord(json)) return null;
  const features = json.features;
  if (!Array.isArray(features)) return null;
  const first = features[0];
  if (!isUnknownRecord(first)) return null;
  const properties = first.properties;
  if (!isUnknownRecord(properties)) return null;
  return properties[property];
}

type GeospatialInterfaceProps = StageProps<'Geospatial'>;

export default function GeospatialInterface({
  stage,
}: GeospatialInterfaceProps) {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, Action>>();
  const dragSafeRef = useRef(null);

  const { isE2E } = useContractFlags();
  const useStub = isE2E && isMapboxStubBrowser();

  const [navState, setNavState] = useState<{
    activeIndex: number;
    direction: Direction | null;
  }>({
    activeIndex: 0,
    direction: null,
  });

  const mapOptions = stage.mapOptions as ExtendedMapOptions;
  const { promptIndex, prompt: currentPrompt } = usePrompts<{
    variable?: string;
  }>();

  const stageNodes = usePropSelector(getNetworkNodesForType, {
    stage,
  });

  const { url: dataSourceUrl } = useAssetUrl(mapOptions.dataSourceAssetId);

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

  const setLocationValue = useCallback(
    (value: string | null) => {
      void updateNode({
        nodeId: stageNodes[navState.activeIndex]![entityPrimaryKeyProperty],
        newAttributeData: {
          [currentPrompt.variable!]: value,
        },
      });
    },
    [updateNode, stageNodes, navState.activeIndex, currentPrompt.variable],
  );

  const initialSelectionValue: string | undefined =
    currentPrompt?.variable && stageNodes[navState.activeIndex]?.attributes
      ? (stageNodes[navState.activeIndex]?.attributes?.[
          currentPrompt.variable
        ] as string | undefined)
      : undefined;

  // In stub mode, mapContainerRef is never attached so the hook's main
  // useEffect early-returns (see useMapbox.ts) and the hook contributes
  // nothing observable. Calling unconditionally avoids conditional-hook
  // violations.
  const {
    mapContainerRef,
    mapRef,
    accessToken,
    isStageReady,
    zoomLevel,
    handleResetMapZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetSelection,
  } = useMapbox({
    mapOptions,
    dataSourceAssetId: mapOptions.dataSourceAssetId,
    dataSourceUrl,
    initialSelectionValue,
    onSelectionChange: (value: string) => {
      if (currentPrompt && stageNodes[navState.activeIndex]) {
        setLocationValue(value);
      }
    },
  });

  // Stub-mode state mirrors the observable map state: zoom level
  // (data-zoom-level), readiness flag (data-map-idle), and the feature ID
  // resolved from the GeoJSON for click-to-select. Real mode ignores all
  // of this.
  const [stubZoom, setStubZoom] = useState<number>(mapOptions.initialZoom);
  const [stubReady, setStubReady] = useState(false);
  const [stubFeatureId, setStubFeatureId] = useState<string | null>(null);

  useEffect(() => {
    if (!useStub) return;
    if (!dataSourceUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(dataSourceUrl);
        const json: unknown = await response.json();
        if (cancelled) return;
        const value = readFirstFeatureProperty(
          json,
          mapOptions.targetFeatureProperty,
        );
        setStubFeatureId(typeof value === 'string' ? value : 'stub-feature');
        setStubReady(true);
      } catch {
        if (cancelled) return;
        setStubFeatureId('stub-feature');
        setStubReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useStub, dataSourceUrl, mapOptions.targetFeatureProperty]);

  // Stub toolbar handlers — synchronous state updates so the fixture's
  // expect.poll() on data-zoom-level resolves on the next render tick.
  const handleStubZoomIn = useCallback(
    () => setStubZoom((z) => z + STUB_ZOOM_STEP),
    [],
  );
  const handleStubZoomOut = useCallback(
    () => setStubZoom((z) => z - STUB_ZOOM_STEP),
    [],
  );
  const handleStubRecenter = useCallback(
    () => setStubZoom(mapOptions.initialZoom),
    [mapOptions.initialZoom],
  );

  const handleStubMapClick = useCallback(() => {
    if (!stubFeatureId) return;
    if (!currentPrompt) return;
    if (!stageNodes[navState.activeIndex]) return;
    setLocationValue(stubFeatureId);
  }, [
    stubFeatureId,
    currentPrompt,
    stageNodes,
    navState.activeIndex,
    setLocationValue,
  ]);

  // Pick handlers based on mode. The toolbar buttons render the same way in
  // both modes; only the wired callbacks differ.
  const onZoomIn = useStub ? handleStubZoomIn : handleZoomIn;
  const onZoomOut = useStub ? handleStubZoomOut : handleZoomOut;
  const onRecenter = useStub ? handleStubRecenter : handleResetMapZoom;
  const observedZoom = useStub ? stubZoom : zoomLevel;
  const observedIdle = useStub ? stubReady : isStageReady;

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
    <div className="relative flex size-full flex-col" ref={dragSafeRef}>
      <motion.div
        className="size-full"
        ref={useStub ? undefined : mapContainerRef}
        variants={fadeVariants}
        data-testid="map-container"
        data-map-idle={observedIdle}
        data-zoom-level={observedZoom}
        data-geospatial-stub={useStub ? 'true' : undefined}
      >
        {/* Stub click area — fills the map region. Real mode renders nothing
            here; Mapbox owns the canvas inside the same container. */}
        {useStub && (
          <button
            type="button"
            aria-label="Stubbed map (click to select test feature)"
            onClick={handleStubMapClick}
            disabled={!stubReady}
            data-testid="geospatial-stub-click-area"
            className="bg-accent/10 absolute inset-0 cursor-crosshair"
          />
        )}

        {/* if outside-selectable-areas, add an overlay */}
        {initialSelectionValue === 'outside-selectable-areas' && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center"
            data-testid="outside-selectable-overlay"
          >
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
                data-testid="deselect-outside-area-button"
              >
                Deselect
              </Button>
            </div>
          </div>
        )}

        {mapOptions.allowSearch &&
          (useStub ? (
            <GeospatialStubSearch className="absolute top-4 left-4 z-20" />
          ) : (
            <GeospatialSearch
              accessToken={accessToken}
              map={mapRef.current}
              proximity={mapOptions.center}
              resetKey={navState.activeIndex}
              className="absolute top-4 left-4 z-20"
            />
          ))}

        {/* Map toolbar - zoom controls */}
        <MotionSurface
          noContainer
          level={0}
          spacing="none"
          elevation="none"
          className="bg-surface/80 absolute right-4 bottom-4 z-5 flex flex-col gap-2 rounded-xl p-2 shadow-2xl backdrop-blur-md"
          data-testid="map-toolbar"
          variants={{
            initial: {
              opacity: 0,
              x: '100%',
            },
            animate: {
              opacity: 1,
              x: 0,
            },
          }}
        >
          <IconButton
            size="lg"
            onClick={onZoomIn}
            icon={<ZoomIn />}
            aria-label="Zoom In"
            color="dynamic"
            data-testid="map-zoom-in"
          />
          <IconButton
            size="lg"
            onClick={onZoomOut}
            icon={<ZoomOut />}
            aria-label="Zoom Out"
            color="dynamic"
            data-testid="map-zoom-out"
          />
          <IconButton
            size="lg"
            onClick={onRecenter}
            icon={<LocateFixed />}
            aria-label="Recenter Map"
            color="dynamic"
            data-testid="map-recenter"
          />
        </MotionSurface>

        <CollapsablePrompts
          currentPromptIndex={promptIndex}
          dragConstraints={dragSafeRef}
          className="flex flex-col items-center gap-4"
        >
          <AnimatePresence mode="wait">
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
                <Node
                  size="sm"
                  nodeId={
                    stageNodes[navState.activeIndex]![entityPrimaryKeyProperty]
                  }
                  type={stageNodes[navState.activeIndex]!.type}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <Button
            size="sm"
            color="primary"
            onClick={handleOutsideSelectableAreas}
            disabled={initialSelectionValue === 'outside-selectable-areas'}
            data-testid="outside-selectable-areas-button"
          >
            Outside Selectable Areas
          </Button>
        </CollapsablePrompts>
      </motion.div>
    </div>
  );
}
