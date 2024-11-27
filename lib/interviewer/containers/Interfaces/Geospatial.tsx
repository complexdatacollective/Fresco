import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { Protocol } from '~/lib/protocol-validation/schemas/src/8.zod';

const INITIAL_ZOOM = 10; // should this be configurable?

type GeospatialStage = Extract<
  Protocol['stages'][number],
  { type: 'Geospatial' }
>;

export default function GeospatialInterface({
  stage,
}: {
  stage: GeospatialStage;
}) {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [selection, setSelection] = useState(null);
  const { center, token, layers, prompts } = stage;

  const filterLayer = layers.find((layer) => layer.filter);

  const currentPrompt = prompts[0]; // only one prompt for now

  const handleReset = () => {
    mapRef.current.flyTo({
      zoom: INITIAL_ZOOM,
      center,
    });

    setSelection(null);

    if (filterLayer) {
      mapRef.current.setFilter(filterLayer.id, ['==', filterLayer.filter, '']);
    }
  };

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
          // hardcoded source name for now
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
    <div className="interface">
      <h1>Geospatial Interface</h1>
      <div>
        <h2>{currentPrompt?.text}</h2>
        <button onClick={handleReset}>Reset</button>
        <p>Selected: {selection}</p>
      </div>
      <div className="h-full w-full p-2" ref={mapContainerRef} />
    </div>
  );
}
