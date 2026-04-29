import { useSearchBoxCore } from '@mapbox/search-js-react';
import { debounce } from 'es-toolkit';
import type { Map } from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Zoom level when flying to a selected location
const FLY_TO_ZOOM = 14;

// Infer the suggestion type from the SearchBoxCore API to avoid importing
// from @mapbox/search-js-core (which pnpm doesn't hoist to top-level).
type SearchBoxInstance = ReturnType<typeof useSearchBoxCore>;
type SuggestResponse = Awaited<ReturnType<SearchBoxInstance['suggest']>>;
export type Suggestion = SuggestResponse['suggestions'][number];

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

  // UUIDv4 per Mapbox recommendation: https://docs.mapbox.com/api/search/search-box/#get-suggested-results
  // A session is one suggest→retrieve cycle.
  // We rotate the token when a search is explicitly completed, cleared, or reset
  // to avoid unpredictable billing.
  // https://docs.mapbox.com/api/search/search-box/#session-billing
  // Use a state initializer so crypto.randomUUID() is only called once (on mount),
  // not on every render.
  const [initialSessionToken] = useState(() => crypto.randomUUID());
  const sessionTokenRef = useRef(initialSessionToken);

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
          sessionToken: sessionTokenRef.current,
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
  }, [accessToken, proximityOption]);

  const fetchSuggestionsRef = useRef(fetchSuggestions);
  fetchSuggestionsRef.current = fetchSuggestions;

  const reset = useCallback(() => {
    fetchSuggestionsRef.current?.cancel();
    sessionTokenRef.current = crypto.randomUUID();
    setQuery('');
    setSuggestions([]);
    setIsLoading(false);
  }, []);

  // Clear state when resetKey changes
  useEffect(() => {
    reset();
  }, [resetKey, reset]);

  // Cancel pending debounced fetch when fetchSuggestions changes (new instance
  // created because accessToken/proximityOption changed) or on unmount.
  // This prevents a stale debounce timer from updating state with old results.
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
          sessionToken: sessionTokenRef.current,
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
      reset();
    },
    [map, accessToken, reset],
  );

  const clear = reset;

  return {
    query,
    handleQueryChange,
    suggestions,
    isLoading,
    handleSelect,
    clear,
  };
};
