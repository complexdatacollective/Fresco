import { type MapOptions } from '@codaco/protocol-validation';
import type { MapMouseEvent } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeGetApiKeyAssetValue } from '~/lib/interviewer/selectors/protocol';

const MAP_CONSTS = {
  FILL_OPACITY: 0.5,
  HOVER_OPACITY: 0.2,
  LINE_WIDTH: 1,
} as const;

// Map protocol color names to Tailwind CSS variable names
const PROTOCOL_TO_THEME_VAR: Record<string, string> = {
  'ord-color-seq-1': '--color-ord-1',
  'ord-color-seq-2': '--color-ord-2',
  'ord-color-seq-3': '--color-ord-3',
  'ord-color-seq-4': '--color-ord-4',
  'ord-color-seq-5': '--color-ord-5',
  'ord-color-seq-6': '--color-ord-6',
  'ord-color-seq-7': '--color-ord-7',
  'ord-color-seq-8': '--color-ord-8',
  'ord-color-seq-9': '--color-ord-9',
  'ord-color-seq-10': '--color-ord-10',
  'primary-color-seq-1': '--color-node-1',
  'primary-color-seq-2': '--color-node-2',
  'primary-color-seq-3': '--color-node-3',
  'primary-color-seq-4': '--color-node-4',
  'primary-color-seq-5': '--color-node-5',
  'primary-color-seq-6': '--color-node-6',
  'primary-color-seq-7': '--color-node-7',
  'primary-color-seq-8': '--color-node-8',
  'cat-color-seq-1': '--color-cat-1',
  'cat-color-seq-2': '--color-cat-2',
  'cat-color-seq-3': '--color-cat-3',
  'cat-color-seq-4': '--color-cat-4',
  'cat-color-seq-5': '--color-cat-5',
  'cat-color-seq-6': '--color-cat-6',
  'cat-color-seq-7': '--color-cat-7',
  'cat-color-seq-8': '--color-cat-8',
  'cat-color-seq-9': '--color-cat-9',
  'cat-color-seq-10': '--color-cat-10',
};

const DEFAULT_COLOR_VAR = '--color-node-1';
const DEFAULT_FALLBACK = 'rgb(226, 33, 91)';

type UseMapboxProps = {
  mapOptions: MapOptions;
  getAssetUrl: (url: string) => string | undefined;
  initialSelectionValue?: string;
  onSelectionChange: (value: string) => void;
  show: boolean;
};

export const useMapbox = ({
  mapOptions,
  getAssetUrl,
  initialSelectionValue,
  onSelectionChange,
  show,
}: UseMapboxProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const {
    center,
    initialZoom,
    tokenAssetId,
    dataSourceAssetId,
    color,
    targetFeatureProperty,
    style,
  } = mapOptions;

  // get token value from asset manifest, using id
  const getApiAssetKeyValue = useSelector(makeGetApiKeyAssetValue);
  const accessToken = useMemo(
    () => getApiAssetKeyValue(tokenAssetId),
    [getApiAssetKeyValue, tokenAssetId],
  );

  const handleResetMapZoom = useCallback(() => {
    mapRef.current?.flyTo({
      zoom: initialZoom,
      center,
    });
  }, [center, initialZoom, mapRef]);

  const handleResetSelection = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setFilter('selection', ['==', targetFeatureProperty, '']);
    }
  }, [targetFeatureProperty]);

  useEffect(() => {
    if (!mapContainerRef.current || !center || !accessToken || !show) return;

    mapboxgl.accessToken = accessToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom: initialZoom,
      style,
    });

    const handleMapLoad = () => {
      setIsMapLoaded(true);

      if (mapRef.current) {
        mapRef.current.addSource('geojson-data', {
          type: 'geojson',
          data: getAssetUrl(dataSourceAssetId),
          promoteId: targetFeatureProperty,
        });
        // Zoom buttons
        mapRef.current.addControl(
          new mapboxgl.NavigationControl({
            showCompass: false,
          }),
        );
      }

      // Read CSS variable value using getComputedStyle for Mapbox GL paint properties
      const colorVar = PROTOCOL_TO_THEME_VAR[color] ?? DEFAULT_COLOR_VAR;
      const ncColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue(colorVar)
          .trim() || DEFAULT_FALLBACK;

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
          'fill-opacity': MAP_CONSTS.FILL_OPACITY,
        },
        filter: ['==', targetFeatureProperty ?? '', ''],
      });
      // hover layer
      mapRef.current?.addLayer({
        id: 'hover',
        type: 'fill',
        source: 'geojson-data',
        paint: {
          'fill-color': ncColor,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            MAP_CONSTS.HOVER_OPACITY,
            0, // non-hovered features
          ],
        },
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
    getAssetUrl,
    initialZoom,
    color,
    targetFeatureProperty,
    dataSourceAssetId,
    style,
    show,
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
          targetFeatureProperty,
          initialSelectionValue,
        ]);
      } else {
        mapInstance.once('styledata', () => {
          mapInstance.setFilter('selection', [
            '==',
            targetFeatureProperty,
            initialSelectionValue,
          ]);
        });
      }
    }
    const handleOutsideSelectableAreas = (e: MapMouseEvent) => {
      // check if e.point is in a selectable area
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ['layerToSelect'],
      });

      if (!features.length) {
        onSelectionChange('outside-selectable-areas');
      }
    };

    const handleLayerClick = (e: MapMouseEvent) => {
      if (!e?.features?.length) return;
      const feature = e.features[0];

      const selected: string | null = feature?.properties
        ? (feature.properties[targetFeatureProperty] as string)
        : null;

      if (selected !== null) {
        onSelectionChange(selected);
      }

      if (mapInstance) {
        mapInstance.setFilter('selection', [
          '==',
          targetFeatureProperty,
          selected ?? '',
        ]);
      }
    };

    // handle hover events
    let hoveredFeatureId: string | null = null;
    const handleMouseMove = (e: MapMouseEvent) => {
      if (!e?.features?.length) return;
      const feature = e.features[0];

      if (hoveredFeatureId !== null) {
        mapInstance.setFeatureState(
          { source: 'geojson-data', id: hoveredFeatureId },
          { hover: false },
        );
      }

      hoveredFeatureId = feature?.id !== undefined ? String(feature.id) : null;
      if (hoveredFeatureId === null) return;
      mapInstance.setFeatureState(
        { source: 'geojson-data', id: hoveredFeatureId },
        { hover: true },
      );
    };
    const handleMouseLeave = () => {
      if (hoveredFeatureId !== null) {
        mapInstance.setFeatureState(
          { source: 'geojson-data', id: hoveredFeatureId },
          { hover: false },
        );
      }
      hoveredFeatureId = null;
    };

    // add event listeners to map
    mapInstance.on('click', 'layerToSelect', handleLayerClick);
    mapInstance.on('click', handleOutsideSelectableAreas);
    mapInstance.on('mousemove', 'layerToSelect', handleMouseMove);
    mapInstance.on('mouseleave', 'layerToSelect', handleMouseLeave);

    // cleanup
    return () => {
      mapInstance.off('click', 'layerToSelect', handleLayerClick);
      mapInstance.off('click', handleOutsideSelectableAreas);
      mapInstance.off('mousemove', 'layerToSelect', handleMouseMove);
      mapInstance.off('mouseleave', 'layerToSelect', handleMouseLeave);
    };
  }, [
    isMapLoaded,
    mapRef,
    initialSelectionValue,
    onSelectionChange,
    targetFeatureProperty,
  ]);

  return {
    mapContainerRef,
    handleResetMapZoom,
    handleResetSelection,
  };
};
