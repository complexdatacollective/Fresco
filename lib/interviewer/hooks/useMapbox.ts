import type { MapMouseEvent } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { getAssetUrlFromId } from '../selectors/protocol';

const MAP_CONSTANTS = {
  STYLE: 'mapbox://styles/mapbox/standard',
  DEFAULT_LAYER_OPACITY: 0.5,
  DEFAULT_LINE_WIDTH: 1,
} as const;

//TODO: import this from schema
// prob should be two types, one for line and one for fill instead of optional fields
type MapLayer = {
  id: string;
  type: 'line' | 'fill';
  data: string;
  color: string;
  width?: number;
  opacity?: number;
  filter?: string;
};

type UseMapboxProps = {
  accessToken: string;
  center: [number, number];
  initialZoom?: number;
  layers: MapLayer[];
  tokenId: string;
  getAssetUrl: (url: string) => string;
  initialSelectionValue?: string;
  onSelectionChange: (value: string | null) => void;
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
  center,
  initialZoom = 10,
  layers = [],
  tokenId,
  getAssetUrl,
  initialSelectionValue,
  onSelectionChange,
}: UseMapboxProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const selectionLayer = layers.find((layer) => layer.type === 'fill');

  const accessToken = useMapboxToken(tokenId);

  const handleResetMapZoom = useCallback(() => {
    mapRef.current?.flyTo({
      zoom: initialZoom,
      center,
    });
  }, [center, initialZoom, mapRef]);

  const handleResetSelection = useCallback(() => {
    if (selectionLayer && mapRef.current) {
      mapRef.current.setFilter(selectionLayer.id, [
        '==',
        selectionLayer.filter,
        '',
      ]);
    }
  }, [selectionLayer]);

  useEffect(() => {
    if (!mapContainerRef.current || !center || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    const dataSources = [
      ...new Set(layers.map((layer) => getAssetUrl(layer.data))),
    ];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: initialZoom,
      style: MAP_CONSTANTS.STYLE,
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
              'line-width': layer.width ?? MAP_CONSTANTS.DEFAULT_LINE_WIDTH,
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
              'fill-opacity':
                layer.opacity ?? MAP_CONSTANTS.DEFAULT_LAYER_OPACITY,
            },
            filter: ['==', layer.filter ?? '', ''],
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

  // handle selections
  useEffect(() => {
    if (!isMapLoaded || !selectionLayer) return;

    const mapInstance = mapRef.current;
    if (!mapInstance) return;

    // Set initial filter if node has a value
    if (initialSelectionValue) {
      if (mapInstance.isStyleLoaded()) {
        mapInstance.setFilter(selectionLayer.id, [
          '==',
          selectionLayer.filter,
          initialSelectionValue,
        ]);
      } else {
        mapInstance.once('styledata', () => {
          mapInstance.setFilter(selectionLayer.id, [
            '==',
            selectionLayer.filter,
            initialSelectionValue,
          ]);
        });
      }
    }

    const handleMapClick = (e: MapMouseEvent) => {
      if (!e?.features?.length) return;
      const feature = e.features[0];
      const propToSelect = selectionLayer.filter;

      const selected = feature?.properties
        ? feature.properties[propToSelect]
        : null;

      onSelectionChange(selected);

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
    selectionLayer,
    mapRef,
    initialSelectionValue,
    onSelectionChange,
  ]);

  return {
    mapContainerRef,
    handleResetMapZoom,
    handleResetSelection,
  };
};
