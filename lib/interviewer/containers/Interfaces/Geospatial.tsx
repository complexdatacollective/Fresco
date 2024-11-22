import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { env } from '~/env';

const INITIAL_CENTER = [-87.6298, 41.8781]; //chicago
const INITIAL_ZOOM = 10;
const TILESET_URL = 'mapbox://buckhalt.8xmfmn5d'; // chicago census tracts tileset. private -- needs to be used with corresponding mapbox token.

export default function GeospatialInterface() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [selectedCensusTract, setSelectedCensusTract] = useState(null);

  const handleReset = () => {
    mapRef.current.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    setSelectedCensusTract(null);
  };

  useEffect(() => {
    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: 'mapbox://styles/mapbox/light-v11',
    });

    mapRef.current.on('load', () => {
      // add census geojson using tileset
      mapRef.current.addSource('chicago-census-tiles', {
        type: 'vector',
        url: TILESET_URL,
      });

      // census tract outlines
      mapRef.current.addLayer({
        'id': 'censusTractsOutlineLayer',
        'type': 'line',
        'source': 'chicago-census-tiles',
        'source-layer': 'Census_Tracts_2010-6h8rw5',
        'paint': {
          'line-color': 'purple',
          'line-width': 2,
        },
      });
      mapRef.current.addLayer({
        'id': 'censusTractsFillLayer',
        'type': 'fill',
        'source': 'chicago-census-tiles',
        'source-layer': 'Census_Tracts_2010-6h8rw5',
        'paint': {
          'fill-color': 'purple',
          'fill-opacity': 0.1,
        },
      });

      mapRef.current.addLayer({
        'id': 'selectedCensusTract',
        'type': 'fill',
        'source': 'chicago-census-tiles',
        'source-layer': 'Census_Tracts_2010-6h8rw5',
        'paint': {
          'fill-color': 'green',
          'fill-opacity': 0.5,
        },
        'filter': ['==', 'namelsad10', ''],
      });

      // handle click of census tracts
      mapRef.current.on('click', 'censusTractsFillLayer', (e) => {
        const feature = e.features[0];
        const tractId = feature.properties.namelsad10; // census tract name prop in the tileset. comes from the geojson.
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
  }, []);

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
