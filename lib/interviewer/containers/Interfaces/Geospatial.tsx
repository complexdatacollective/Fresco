import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Protocol } from '~/lib/protocol-validation/schemas/src/8.zod';
import Button from '~/lib/ui/components/Button';
import { usePrompts } from '../../behaviours/withPrompt';
import CollapsablePrompts from '../../components/CollapsablePrompts';
import Node from '../../components/Node';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import usePropSelector from '../../hooks/usePropSelector';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { getNetworkNodesForType } from '../../selectors/interface';

// Map configuration constants
// Could be configurable from the protocol
const INITIAL_ZOOM = 12;
const STYLE = 'mapbox://styles/mapbox/standard';

const NodeAnimationVariants = {
  initial: (navDirection: 'forwards' | 'backwards') => ({
    opacity: 0,
    x: navDirection === 'backwards' ? '-100%' : '100%',
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'tween',
      duration: 0.3,
    },
  },
  exit: (navDirection: 'forwards' | 'backwards') => ({
    opacity: 0,
    x: navDirection === 'backwards' ? '100%' : '-100%',
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

export default function GeospatialInterface({
  stage,
  registerBeforeNext,
}: {
  stage: GeospatialStage;
  registerBeforeNext: (
    beforeNext: (direction: 'forwards' | 'backwards') => boolean,
  ) => void;
}) {
  const dispatch = useDispatch();

  const updateNode = useCallback(
    (...properties) => dispatch(sessionActions.updateNode(...properties)),
    [dispatch],
  );

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const dragSafeRef = useRef(null);
  const { center, token, layers, prompts } = stage;

  const filterLayer = layers.find((layer) => layer.filter);

  const { prompt: currentPrompt } = usePrompts();

  const handleResetMapZoom = useCallback(() => {
    mapRef.current?.flyTo({
      zoom: INITIAL_ZOOM,
      center,
    });
  }, [center]);

  const handleResetSelection = useCallback(() => {
    if (filterLayer && mapRef.current) {
      mapRef.current.setFilter(filterLayer.id, ['==', filterLayer.filter, '']);
    }
  }, [filterLayer]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [navDirection, setNavDirection] = useState<
    'forwards' | 'backwards' | null
  >(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const getNodeIndex = useCallback(() => activeIndex - 1, [activeIndex]);
  const stageNodes = usePropSelector(getNetworkNodesForType, { stage });
  const isLastNode = useCallback(
    () => activeIndex + 1 >= stageNodes.length,
    [activeIndex, stageNodes.length],
  );

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

  const beforeNext = (direction: 'forwards' | 'backwards') => {
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
    const readyForNext = !!stageNodes[activeIndex][currentPrompt.variable];
    setIsReadyForNext(readyForNext);
  }, [activeIndex, currentPrompt.variable, setIsReadyForNext, stageNodes]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !center || !token) return;

    mapboxgl.accessToken = token;
    const dataSources = [...new Set(layers.map((layer) => layer.data))];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: INITIAL_ZOOM,
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
        if (layer.type === 'line') {
          mapRef.current?.addLayer({
            id: layer.id,
            type: 'line',
            source: 'geojson-data',
            paint: {
              'line-color': layer.color,
              'line-width': (layer.width as number) ?? 1,
            },
          });
        } else if (layer.type === 'fill' && !layer.filter) {
          mapRef.current?.addLayer({
            id: layer.id,
            type: 'fill',
            source: 'geojson-data',
            paint: {
              'fill-color': layer.color,
              'fill-opacity': layer.opacity,
            },
          });
        } else if (layer.type === 'fill' && layer.filter) {
          mapRef.current?.addLayer({
            id: layer.id,
            type: 'fill',
            source: 'geojson-data',
            paint: {
              'fill-color': layer.color,
              'fill-opacity': layer.opacity,
            },
            filter: ['==', layer.filter, ''],
          });
        }
      });
    };

    const handleMapStyleLoad = () => {
      // ensure map is loaded before adding layers
      // necessary to prevent "style not loaded" errors
      if (mapRef.current.isStyleLoaded()) {
        handleMapLoad();
      } else {
        mapRef.current.once('styledata', handleMapLoad);
      }
    };

    mapRef.current.on('load', handleMapStyleLoad);

    return () => {
      mapRef.current?.remove();
    };
  }, [center, layers, token]);

  // handle map selections
  useEffect(() => {
    if (!isMapLoaded || !currentPrompt || !filterLayer) return;

    const mapInstance = mapRef.current;
    if (!mapInstance) return;

    // Set initial filter if node has a value
    const initialFilterValue =
      stageNodes[activeIndex].attributes[currentPrompt.variable];

    if (initialFilterValue) {
      mapInstance.setFilter(filterLayer.id, [
        '==',
        filterLayer.filter,
        initialFilterValue,
      ]);
    }

    const handleMapClick = (e) => {
      const feature = e.features[0];
      const propToSelect = currentPrompt.mapVariable;
      const selected = feature.properties[propToSelect];

      updateNode(
        stageNodes[activeIndex][entityPrimaryKeyProperty],
        {},
        {
          [currentPrompt.variable]: selected,
        },
      );

      mapInstance.setFilter(filterLayer.id, [
        '==',
        filterLayer.filter,
        selected,
      ]);
    };

    // add click event listener to map
    mapInstance.on('click', currentPrompt.layer, handleMapClick);

    // cleanup
    return () => {
      mapInstance.off('click', currentPrompt.layer, handleMapClick);
    };
  }, [
    isMapLoaded,
    currentPrompt,
    filterLayer,
    stageNodes,
    activeIndex,
    updateNode,
  ]);

  return (
    <div
      className="interface w-full items-center justify-center"
      ref={dragSafeRef}
    >
      <div id="map-container" className="h-full w-full" ref={mapContainerRef} />

      <div className="absolute top-10 right-14 z-10">
        <Button size="small" onClick={handleResetMapZoom}>
          Recenter Map
        </Button>
      </div>

      <CollapsablePrompts
        currentPromptIndex={prompts.indexOf(currentPrompt)}
        dragConstraints={dragSafeRef}
      >
        <AnimatePresence
          mode="wait"
          key={currentPrompt.id}
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
