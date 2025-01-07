import type { MapMouseEvent } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { MapOptions } from '~/lib/protocol-validation/schemas/src/8.zod';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { getAssetUrlFromId } from '../../../selectors/protocol';

export const MAP_CONSTS = {
  STYLE: 'mapbox://styles/mapbox/standard',
  OPACITY: 0.5,
  LINE_WIDTH: 1,
} as const;

type UseMapboxProps = {
  mapOptions: MapOptions;
  getAssetUrl: (url: string) => string;
  initialSelectionValue?: string;
  onSelectionChange: (value: string) => void;
};

const useMapboxToken = (tokenId: string) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const getAssetUrl = useSelector(getAssetUrlFromId);
  const assetUrl = getAssetUrl(tokenId) as string;

  if (!assetUrl) {
    throw new Error('No asset URL found for token ID');
  }

  useEffect(() => {
    const fetchTokenFile = async () => {
      try {
        const response = await fetch(assetUrl);
        if (!response.ok) {
          throw new Error('Error fetching the token file');
        }
        const tokenText = await response.text();
        setAccessToken(tokenText);
      } catch (error) {
        throw new Error('Error fetching the token file');
      }
    };

    void fetchTokenFile();
  }, [assetUrl, getAssetUrl, tokenId]);

  return accessToken;
};

export const useMapbox = ({
  mapOptions,
  getAssetUrl,
  initialSelectionValue,
  onSelectionChange,
}: UseMapboxProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const { center, initialZoom, token, dataSource, color, propToSelect } = mapOptions;
  const accessToken = useMapboxToken(token);

  const handleResetMapZoom = useCallback(() => {
    mapRef.current?.flyTo({
      zoom: initialZoom,
      center,
    });
  }, [center, initialZoom, mapRef]);

  const handleResetSelection = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setFilter('selection', ['==', propToSelect, '']);
    }
  }, [propToSelect]);

  useEffect(() => {
    if (!mapContainerRef.current || !center || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: initialZoom,
      style: MAP_CONSTS.STYLE,
    });

    const handleMapLoad = () => {
      setIsMapLoaded(true);

      if (mapRef.current) {
        mapRef.current.addSource('geojson-data', {
          type: 'geojson',
          data: getAssetUrl(dataSource),
        });
      }

      const ncColor =
        getCSSVariableAsString(`--nc-${color}`) ??
        getCSSVariableAsString('--nc-primary-color-seq-1') ??
        'black';

      mapRef.current?.addLayer({
        id: 'outline',
        type: 'line',
        source: 'geojson-data',
        paint: {
          'line-color': ncColor,
          'line-width': MAP_CONSTS.LINE_WIDTH,
        },
      });

      // add the fill layer that can be selected
      mapRef.current?.addLayer({
        id: 'layerToSelect',
        type: 'fill',
        source: 'geojson-data',
        paint: {
          'fill-color': ncColor, // must have a color to be used even when transparent
          'fill-opacity': 0,
        },
      });
      mapRef.current?.addLayer({
        id: 'selection',
        type: 'fill',
        source: 'geojson-data',
        paint: {
          'fill-color': ncColor,
          'fill-opacity': MAP_CONSTS.OPACITY,
        },
        filter: ['==', propToSelect ?? '', ''],
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
  }, [
    accessToken,
    center,
    dataSource,
    getAssetUrl,
    initialZoom,
    color,
    propToSelect,
  ]);

  // handle selections
  useEffect(() => {
    if (!isMapLoaded) return;

    const mapInstance = mapRef.current;
    if (!mapInstance) return;

    // Set initial filter if node has a value
    if (initialSelectionValue) {
      if (mapInstance.isStyleLoaded()) {
        mapInstance.setFilter('selection', [
          '==',
          propToSelect,
          initialSelectionValue,
        ]);
      } else {
        mapInstance.once('styledata', () => {
          mapInstance.setFilter('selection', [
            '==',
            propToSelect,
            initialSelectionValue,
          ]);
        });
      }
    }

    const handleMapClick = (e: MapMouseEvent) => {
      if (!e?.features?.length) return;
      const feature = e.features[0];

      const selected: string | null = feature?.properties
        ? (feature.properties[propToSelect] as string)
        : null;

      if (selected !== null) {
        onSelectionChange(selected);
      }

      if (mapInstance) {
        mapInstance.setFilter('selection', [
          '==',
          propToSelect,
          selected ?? '',
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
    mapRef,
    initialSelectionValue,
    onSelectionChange,
    propToSelect,
  ]);

  return {
    mapContainerRef,
    handleResetMapZoom,
    handleResetSelection,
  };
};
