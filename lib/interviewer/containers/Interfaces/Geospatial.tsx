import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Protocol } from '~/lib/protocol-validation/schemas/src/8.zod';
import Button from '~/lib/ui/components/Button';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import Node from '../../components/Node';
import Prompts from '../../components/Prompts';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import usePropSelector from '../../hooks/usePropSelector';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { getNetworkNodesForType } from '../../selectors/interface';

const INITIAL_ZOOM = 10; // should this be configurable?

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

  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [selection, setSelection] = useState(null);
  const { center, token, layers, prompts } = stage;

  const filterLayer = layers.find((layer) => layer.filter);

  const currentPrompt = prompts[0]; // only one prompt for now

  const handleResetMap = useCallback(() => {
    mapRef.current.flyTo({
      zoom: INITIAL_ZOOM,
      center,
    });

    setSelection(null);

    if (filterLayer) {
      mapRef.current.setFilter(filterLayer.id, ['==', filterLayer.filter, '']);
    }
  }, [center, filterLayer]);

  const [activeIndex, setActiveIndex] = useState(0);
  const getNodeIndex = useCallback(() => activeIndex - 1, [activeIndex]);
  const stageNodes = usePropSelector(getNetworkNodesForType, { stage });
  console.log('stageNodes', stageNodes);
  const isLastNode = useCallback(
    () => activeIndex + 1 >= stageNodes.length,
    [activeIndex, stageNodes.length],
  );
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const previousNode = useCallback(() => {
    setActiveIndex(getNodeIndex());
    handleResetMap();
  }, [getNodeIndex, handleResetMap]);

  const nextNode = useCallback(() => {
    setActiveIndex(activeIndex + 1);
    handleResetMap();
  }, [activeIndex, handleResetMap]);

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

  // Update the navigation button to glow when there is a valid selection
  useEffect(() => {
    const readyForNext = selection !== null;
    setIsReadyForNext(readyForNext);
  }, [selection, setIsReadyForNext]);

  useEffect(() => {
    mapboxgl.accessToken = token;
    const dataSources = [...new Set(layers.map((layer) => layer.data))];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: INITIAL_ZOOM,
      style: 'mapbox://styles/mapbox/light-v11', // should this be configurable?
    });

    mapRef.current.on('load', () => {
      if (!layers) return;

      dataSources.forEach((dataSource) => {
        mapRef.current.addSource('geojson-data', {
          type: 'geojson',
          data: dataSource,
        });
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
              'line-width': 2,
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

      // if there's a prompt, configure the click event
      if (currentPrompt) {
        mapRef.current.on('click', currentPrompt.layer, (e) => {
          const feature = e.features[0];
          const propToSelect = currentPrompt.mapVariable; // Variable from geojson data
          const selected = feature.properties[propToSelect];
          setSelection(selected);
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
  }, [center, currentPrompt, filterLayer, filterLayer?.filter, layers, token]);

  return (
    <div className="interface w-full items-center justify-center">
      <Prompts />
      <Node {...stageNodes[activeIndex]} />

      <div
        id="map-container"
        className="h-2/3 w-2/3 p-2"
        ref={mapContainerRef}
      />

      <Button size="small" onClick={handleResetMap}>
        Reset Map
      </Button>
      <p>Selected: {selection}</p>

      <AnimatePresence>
        <motion.div
          className="flex w-1/3 flex-col items-center gap-1"
          key="progress-container"
          initial={{ opacity: 0, y: 100 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.5, duration: 0.5 },
          }}
          exit={{ opacity: 0, y: 100 }}
        >
          <h6 className="progress-container__status-text">
            <strong>{activeIndex + 1}</strong> of{' '}
            <strong>{stageNodes.length}</strong>
          </h6>
          <ProgressBar
            orientation="horizontal"
            percentProgress={(activeIndex + 1 / stageNodes.length) * 100}
            nudge={false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
