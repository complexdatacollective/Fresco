import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { type StageProps } from '../Stage';

const INITIAL_ZOOM = 10; // should this be configurable?

export default function GeospatialInterface({ stage }: { stage: StageProps }) {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [selectedCensusTract, setSelectedCensusTract] = useState(null);
  const { center, data, token } = stage;

  const handleReset = () => {
    mapRef.current.flyTo({
      zoom: INITIAL_ZOOM,
      center,
    });
    setSelectedCensusTract(null);
    mapRef.current.setFilter('selectedCensusTract', ['==', 'namelsad10', '']);
  };

  useEffect(() => {
    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: INITIAL_ZOOM,
      style: 'mapbox://styles/mapbox/light-v11',
    });

    mapRef.current.on('load', () => {
      mapRef.current.addSource('geojson-data', {
        type: 'geojson',
        data,
      });

      // census tract outlines
      mapRef.current.addLayer({
        id: 'censusTractsOutlineLayer',
        type: 'line',
        source: 'geojson-data',
        paint: {
          'line-color': 'purple',
          'line-width': 2,
        },
      });
      mapRef.current.addLayer({
        id: 'censusTractsFillLayer',
        type: 'fill',
        source: 'geojson-data',
        paint: {
          'fill-color': 'purple',
          'fill-opacity': 0.1,
        },
      });

      mapRef.current.addLayer({
        id: 'selectedCensusTract',
        type: 'fill',
        source: 'geojson-data',
        paint: {
          'fill-color': 'green',
          'fill-opacity': 0.5,
        },
        filter: ['==', 'namelsad10', ''],
      });

      // handle click of census tracts
      mapRef.current.on('click', 'censusTractsFillLayer', (e) => {
        const feature = e.features[0];
        const tractId = feature.properties.namelsad10; // census tract name prop. comes from the geojson. this will need to be configured based on the geojson
        setSelectedCensusTract(tractId);

        mapRef.current.setFilter('selectedCensusTract', [
          '==',
          'namelsad10',
          tractId,
        ]);
      });
    });

    return () => {
      mapRef.current.remove();
    };
  }, [center, data, token]);

  return (
    <div className="interface">
      <h1>Geospatial Interface</h1>
      <div>
        <button onClick={handleReset}>Reset</button>
        <p>Selected: {selectedCensusTract}</p>
      </div>
      <div className="h-full w-full p-2" ref={mapContainerRef} />
    </div>
  );
}
