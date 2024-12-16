import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import mapboxgl, { type MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type {
  Node as NodeType,
  Protocol,
} from '~/lib/protocol-validation/schemas/src/8.zod';
import Button from '~/lib/ui/components/Button';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { usePrompts } from '../../behaviours/withPrompt';
import CollapsablePrompts from '../../components/CollapsablePrompts';
import Loading from '../../components/Loading';
import Node from '../../components/Node';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { useMapboxToken } from '../../hooks/useMapbox';
import usePropSelector from '../../hooks/usePropSelector';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { getNetworkNodesForType } from '../../selectors/interface';
import { getAssetUrlFromId } from '../../selectors/protocol';

// Map configuration constants
// Could be configurable from the protocol
const STYLE = 'mapbox://styles/mapbox/standard';

type NavDirection = 'forwards' | 'backwards';

const NodeAnimationVariants = {
  initial: (navDirection: NavDirection) => ({
    opacity: 0,
    y: navDirection === 'backwards' ? '-100%' : '100%',
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
    y: navDirection === 'backwards' ? '100%' : '-100%',
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
};

export default function GeospatialInterface({
  stage,
  registerBeforeNext,
}: GeospatialInterfaceProps) {
  const dispatch = useDispatch();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const dragSafeRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [navDirection, setNavDirection] = useState<NavDirection | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const { prompts } = stage;
  const { promptIndex } = usePrompts();
  const currentPrompt = prompts[promptIndex];
  const { center, token: tokenId, initialZoom } = stage.mapOptions;
  const layers = currentPrompt?.layers;
  const selectionLayer = layers.find((layer) => layer.type === 'fill');

  const getAssetUrl = useSelector(getAssetUrlFromId);

  const accessToken = useMapboxToken(tokenId);

  const updateNode = useCallback(
    (
      nodeId: string,
      newModelData: Record<string, unknown>,
      newAttributes: Record<string, unknown>,
    ) =>
      dispatch(sessionActions.updateNode(nodeId, newModelData, newAttributes)),
    [dispatch],
  );

  const handleResetMapZoom = useCallback(() => {
    mapRef.current?.flyTo({
      zoom: initialZoom,
      center,
    });
  }, [center, initialZoom]);

  const handleResetSelection = useCallback(() => {
    if (selectionLayer && mapRef.current) {
      mapRef.current.setFilter(selectionLayer.id, [
        '==',
        selectionLayer.filter,
        '',
      ]);
    }
  }, [selectionLayer]);

  const getNodeIndex = useCallback(() => activeIndex - 1, [activeIndex]);
  const stageNodes = usePropSelector(getNetworkNodesForType, {
    stage,
  }) as NodeType[];
  const isLastNode = useCallback(
    () => activeIndex + 1 >= stageNodes.length,
    [activeIndex, stageNodes.length],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [promptIndex]);

  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const previousNode = useCallback(() => {
    setNavDirection('backwards');

    setActiveIndex(getNodeIndex());
    handleResetSelection();
  }, [getNodeIndex, handleResetSelection]);

  const nextNode = useCallback(() => {
    setNavDirection('forwards');

    setActiveIndex(activeIndex + 1);
    handleResetSelection();
  }, [activeIndex, handleResetSelection]);

  const beforeNext = (direction: NavDirection) => {
    // Leave the stage if there are no nodes
    if (stageNodes.length === 0) {
      return true;
    }

    // We are moving backwards.
    if (direction === 'backwards') {
      // if we are at the first node, we should leave the stage
      if (activeIndex === 0) {
        return true;
      }

      previousNode();
      return false;
    }

    // We are moving forwards.
    if (isLastNode()) {
      return true;
    }
    nextNode();
    return false;
  };

  registerBeforeNext(beforeNext);

  // Update navigation button based on selection
  useEffect(() => {
    const readyForNext = currentPrompt?.variable
      ? !!stageNodes[activeIndex][currentPrompt.variable]
      : false;
    setIsReadyForNext(readyForNext);
  }, [activeIndex, currentPrompt?.variable, setIsReadyForNext, stageNodes]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !center || !tokenId) return;

    mapboxgl.accessToken = accessToken;

    const dataSources = [
      ...new Set(layers.map((layer) => getAssetUrl(layer.data))),
    ];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: initialZoom,
      style: STYLE,
    });

    const handleMapLoad = () => {
      setIsMapLoaded(true);

      if (!layers) return;

      dataSources.forEach((dataSource) => {
        if (mapRef.current) {
          mapRef.current.addSource('geojson-data', {
            type: 'geojson',
            data: dataSource,
          });
        }
      });

      // add layers based on the protocol
      layers.forEach((layer) => {
        const color =
          getCSSVariableAsString(`--nc-${layer.color}`) ??
          getCSSVariableAsString('--nc-primary-color-seq-1') ??
          'black';
        if (layer.type === 'line') {
          mapRef.current?.addLayer({
            id: layer.id,
            type: 'line',
            source: 'geojson-data',
            paint: {
              'line-color': color,
              'line-width': layer.width! ?? 1,
            },
          });
        } else if (layer.type === 'fill') {
          // add the fill layer that can be selected
          mapRef.current?.addLayer({
            id: 'layerToSelect',
            type: 'fill',
            source: 'geojson-data',
            paint: {
              'fill-color': 'black', // must have a color to be used even when transparent
              'fill-opacity': 0,
            },
          });
          mapRef.current?.addLayer({
            id: layer.id,
            type: 'fill',
            source: 'geojson-data',
            paint: {
              'fill-color': color,
              'fill-opacity': layer.opacity ?? 0.5,
            },
            filter: ['==', layer.filter, ''],
          });
        }
      });
    };

    const handleMapStyleLoad = () => {
      // ensure map is loaded before adding layers
      // necessary to prevent "style not loaded" errors
      if (mapRef?.current?.isStyleLoaded()) {
        handleMapLoad();
      } else {
        mapRef?.current?.once('styledata', handleMapLoad);
      }
    };

    mapRef.current.on('load', handleMapStyleLoad);

    return () => {
      mapRef.current?.remove();
    };
  }, [accessToken, center, getAssetUrl, initialZoom, layers, tokenId]);

  // handle map selections
  useEffect(() => {
    if (!isMapLoaded || !currentPrompt || !selectionLayer || !accessToken)
      return;

    const mapInstance = mapRef.current;
    if (!mapInstance) return;

    // Set initial filter if node has a value
    const initialSelectionValue =
      currentPrompt?.variable && stageNodes[activeIndex]?.attributes
        ? (stageNodes[activeIndex].attributes as Record<string, unknown>)[
            currentPrompt.variable
          ]
        : undefined;

    if (initialSelectionValue) {
      mapInstance.setFilter(selectionLayer.id, [
        '==',
        selectionLayer.filter,
        initialSelectionValue,
      ]);
    }

    const handleMapClick = (e: MapMouseEvent) => {
      if (!e?.features?.length) return;
      const feature = e.features[0];
      const propToSelect = selectionLayer.filter;

      const selected = feature?.properties
        ? feature.properties[propToSelect]
        : null;

      updateNode(
        stageNodes[activeIndex][entityPrimaryKeyProperty],
        {},
        {
          [currentPrompt.variable]: selected,
        },
      );

      if (selectionLayer && mapInstance) {
        mapInstance.setFilter(selectionLayer.id, [
          '==',
          selectionLayer.filter,
          selected,
        ]);
      }
    };

    // add click event listener to map
    mapInstance.on('click', 'layerToSelect', handleMapClick);

    // cleanup
    return () => {
      mapInstance.off('click', 'layerToSelect', handleMapClick);
    };
  }, [
    isMapLoaded,
    currentPrompt,
    stageNodes,
    activeIndex,
    updateNode,
    accessToken,
    selectionLayer,
  ]);

  if (!accessToken) {
    return <Loading />;
  }

  return (
    <div className="w-full items-center justify-center" ref={dragSafeRef}>
      <div id="map-container" className="h-full w-full" ref={mapContainerRef} />

      <div className="absolute top-10 right-14 z-10">
        <Button size="small" onClick={handleResetMapZoom}>
          Recenter Map
        </Button>
      </div>

      <CollapsablePrompts
        currentPromptIndex={currentPrompt ? prompts.indexOf(currentPrompt) : -1}
        dragConstraints={dragSafeRef}
      >
        <AnimatePresence
          mode="wait"
          key={currentPrompt?.id}
          custom={navDirection}
        >
          <motion.div
            key={stageNodes[activeIndex][entityPrimaryKeyProperty]}
            variants={NodeAnimationVariants}
            custom={navDirection}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Node {...stageNodes[activeIndex]} />
          </motion.div>
        </AnimatePresence>
      </CollapsablePrompts>
    </div>
  );
}
