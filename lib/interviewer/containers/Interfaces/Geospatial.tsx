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
    mapRef.current.flyTo({
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
  >(null); // used for animation
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

  console.log(stageNodes[activeIndex].attributes[currentPrompt.variable]);

  // Update the navigation button to glow when there is a valid selection
  useEffect(() => {
    const readyForNext = !!stageNodes[activeIndex][currentPrompt.variable];
    setIsReadyForNext(readyForNext);
  }, [activeIndex, currentPrompt.variable, setIsReadyForNext, stageNodes]);

  useEffect(() => {
    mapboxgl.accessToken = token;
    const dataSources = [...new Set(layers.map((layer) => layer.data))];

    if (!mapContainerRef.current || !center || !token) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: INITIAL_ZOOM,
      style: STYLE,
    });

    mapRef.current.on('load', () => {
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

      // If the node already has a value, set the selection
      filterLayer &&
        mapRef.current.setFilter(filterLayer.id, [
          '==',
          filterLayer.filter,
          stageNodes[activeIndex].attributes[currentPrompt.variable],
        ]);

      // if there's a prompt, configure the click event
      if (currentPrompt) {
        mapRef.current?.on('click', currentPrompt.layer, (e) => {
          const feature = e.features[0];
          const propToSelect = currentPrompt.mapVariable; // Variable from geojson data
          const selected = feature.properties[propToSelect];
          /**
           * update node with the selected value
           * updateNode(nodeId, newModelData, newAttributeData)
           */
          updateNode(
            stageNodes[activeIndex][entityPrimaryKeyProperty],
            {},
            {
              [currentPrompt.variable]: selected,
            },
          );

          // Apply the filter to the selection layer if it exists
          filterLayer &&
            mapRef.current.setFilter(filterLayer.id, [
              '==',
              filterLayer.filter,
              selected,
            ]);
        });
      }
    });

    return () => {
      mapRef.current.remove();
    };
  }, [center, filterLayer, filterLayer?.filter, layers, token, activeIndex]);

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
