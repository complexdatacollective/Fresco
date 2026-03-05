import { type SearchBoxSuggestion } from '@mapbox/search-js-core';
import { useSearchBoxCore } from '@mapbox/search-js-react';
import { debounce } from 'es-toolkit';
import type { Map } from 'mapbox-gl';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

// Zoom level when flying to a selected location
const FLY_TO_ZOOM = 14;

// Re-export for consumers
export type Suggestion = SearchBoxSuggestion;

export type UseGeospatialSearchProps = {
  accessToken: string | null | undefined;
  map: Map | null;
  proximity?: [number, number];
  /** When this value changes, the search state is reset */
  resetKey?: string | number;
};

export const useGeospatialSearch = ({
  accessToken,
  map,
  proximity,
  resetKey,
}: UseGeospatialSearchProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Stable session token for Mapbox session-based billing - reused across requests in each instance
  const sessionToken = useId();

  // Clear state when resetKey changes
  useEffect(() => {
    setQuery('');
    setSuggestions([]);
    setIsLoading(false);
  }, [resetKey]);

  // Use the hook from @mapbox/search-js-react
  const searchBox = useSearchBoxCore({
    accessToken: accessToken ?? '',
  });

  const searchBoxRef = useRef(searchBox);
  searchBoxRef.current = searchBox;

  const proximityOption = useMemo(
    () => (proximity ? { lng: proximity[0], lat: proximity[1] } : undefined),
    [proximity],
  );

  // Create debounced fetch function
  const fetchSuggestions = useMemo(() => {
    if (!accessToken) return null;

    return debounce(async (value: string) => {
      if (!value.trim()) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await searchBoxRef.current.suggest(value, {
          sessionToken,
          proximity: proximityOption,
        });
        setSuggestions(response.suggestions);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [accessToken, proximityOption, sessionToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetchSuggestions?.cancel();
    };
  }, [fetchSuggestions]);

  const handleQueryChange = useCallback(
    (value: string | undefined) => {
      const safeValue = value ?? '';
      setQuery(safeValue);
      if (safeValue.trim()) {
        setIsLoading(true);
        fetchSuggestions?.(safeValue);
      } else {
        setSuggestions([]);
        setIsLoading(false);
      }
    },
    [fetchSuggestions],
  );

  // Retrieve coordinates and fly to location
  const handleSelect = useCallback(
    async (suggestion: Suggestion) => {
      if (!accessToken || !map) return;

      try {
        const result = await searchBoxRef.current.retrieve(suggestion, {
          sessionToken,
        });
        const feature = result.features[0];
        if (feature?.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates as [number, number];
          map.flyTo({ center: [lng, lat], zoom: FLY_TO_ZOOM });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Retrieve error:', error);
      }
      setQuery('');
      setSuggestions([]);
    },
    [map, accessToken, sessionToken],
  );

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
  }, []);

  return {
    query,
    handleQueryChange,
    suggestions,
    isLoading,
    handleSelect,
    clear,
  };
};
