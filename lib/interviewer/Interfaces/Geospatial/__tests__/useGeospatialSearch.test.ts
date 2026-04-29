import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Module mocks (must appear before imports that use them) ---

type SuggestOptions = { sessionToken: string; proximity?: unknown };
const mockSuggest = vi
  .fn<(query: string, options: SuggestOptions) => Promise<{ suggestions: [] }>>()
  .mockResolvedValue({ suggestions: [] });
const mockRetrieve = vi
  .fn<
    (
      suggestion: unknown,
      options: { sessionToken: string },
    ) => Promise<{
      features: { geometry: { type: string; coordinates: number[] } }[];
    }>
  >()
  .mockResolvedValue({ features: [] });

vi.mock('@mapbox/search-js-react', () => ({
  useSearchBoxCore: () => ({ suggest: mockSuggest, retrieve: mockRetrieve }),
}));

// Make debounce synchronous with a trackable `cancel` so tests can assert on it
const mockCancel = vi.fn();
vi.mock('es-toolkit', () => ({
  debounce: (fn: (...args: unknown[]) => unknown) => {
    const wrapped = (...args: unknown[]) => fn(...args);
    wrapped.cancel = mockCancel;
    return wrapped;
  },
}));

// The hook under test (imported after mocks are declared)
import type { Map } from 'mapbox-gl';
import { type Suggestion, useGeospatialSearch } from '../useGeospatialSearch';

// Minimal Map stub (only flyTo is called by the hook)
const mockMap = { flyTo: vi.fn() } as unknown as Map;

// ---------------------------------------------------------------------------

describe('useGeospatialSearch', () => {
  let uuidCallCount = 0;

  beforeEach(() => {
    uuidCallCount = 0;
    // Provide a deterministic, incrementing UUID so we can assert token identity
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => `session-token-${++uuidCallCount}`),
    });
    mockSuggest.mockClear().mockResolvedValue({ suggestions: [] });
    mockRetrieve.mockClear().mockResolvedValue({ features: [] });
    mockCancel.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Session token stability
  // -------------------------------------------------------------------------

  describe('session token stability', () => {
    it('uses the same session token for multiple suggest() calls within one session', () => {
      const { result } = renderHook(() =>
        useGeospatialSearch({ accessToken: 'test-token', map: mockMap }),
      );

      // mockSuggest is called synchronously before the internal `await`, so
      // mock.calls is populated inside the sync act() block.
      act(() => {
        result.current.handleQueryChange('new york');
      });
      act(() => {
        result.current.handleQueryChange('new york city');
      });

      expect(mockSuggest).toHaveBeenCalledTimes(2);
      const firstToken = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      const secondToken = mockSuggest.mock.calls[1]?.[1]?.sessionToken;
      expect(firstToken).toBeDefined();
      expect(firstToken).toBe(secondToken);
    });
  });

  // -------------------------------------------------------------------------
  // Session token rotation
  // -------------------------------------------------------------------------

  describe('session token rotation', () => {
    it('rotates token and cancels pending debounce when resetKey changes', () => {
      const { result, rerender } = renderHook(
        ({ resetKey }: { resetKey: string }) =>
          useGeospatialSearch({
            accessToken: 'test-token',
            map: mockMap,
            resetKey,
          }),
        { initialProps: { resetKey: 'key-1' } },
      );

      act(() => {
        result.current.handleQueryChange('paris');
      });

      const tokenBefore = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      mockSuggest.mockClear();
      mockCancel.mockClear();

      act(() => {
        rerender({ resetKey: 'key-2' });
      });

      act(() => {
        result.current.handleQueryChange('london');
      });

      const tokenAfter = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      expect(tokenAfter).toBeDefined();
      expect(tokenAfter).not.toBe(tokenBefore);
      expect(mockCancel).toHaveBeenCalled();
    });

    it('rotates token and cancels pending debounce on clear()', () => {
      const { result } = renderHook(() =>
        useGeospatialSearch({ accessToken: 'test-token', map: mockMap }),
      );

      act(() => {
        result.current.handleQueryChange('berlin');
      });

      const tokenBefore = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      mockSuggest.mockClear();
      mockCancel.mockClear();

      act(() => {
        result.current.clear();
      });

      act(() => {
        result.current.handleQueryChange('tokyo');
      });

      const tokenAfter = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      expect(tokenAfter).toBeDefined();
      expect(tokenAfter).not.toBe(tokenBefore);
      expect(mockCancel).toHaveBeenCalled();
    });

    it('rotates token and cancels pending debounce on handleSelect()', async () => {
      mockRetrieve.mockResolvedValueOnce({
        features: [{ geometry: { type: 'Point', coordinates: [13.4, 52.5] } }],
      });

      const { result } = renderHook(() =>
        useGeospatialSearch({ accessToken: 'test-token', map: mockMap }),
      );

      act(() => {
        result.current.handleQueryChange('berlin');
      });

      const tokenBefore = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      mockSuggest.mockClear();
      mockCancel.mockClear();

      await act(async () => {
        await result.current.handleSelect(
          { mapbox_id: 'some-id' } as unknown as Suggestion,
        );
      });

      act(() => {
        result.current.handleQueryChange('paris');
      });

      const tokenAfter = mockSuggest.mock.calls[0]?.[1]?.sessionToken;
      expect(tokenAfter).toBeDefined();
      expect(tokenAfter).not.toBe(tokenBefore);
      expect(mockCancel).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Stale debounce cancellation
  // -------------------------------------------------------------------------

  describe('stale debounce cancellation', () => {
    it('cancels the previous fetchSuggestions instance when accessToken changes', () => {
      const { rerender, unmount } = renderHook(
        ({ accessToken }: { accessToken: string }) =>
          useGeospatialSearch({ accessToken, map: mockMap }),
        { initialProps: { accessToken: 'token-1' } },
      );

      // Clear any cancel calls that may have occurred during initial setup
      mockCancel.mockClear();

      act(() => {
        rerender({ accessToken: 'token-2' });
      });

      // The useEffect cleanup for the old fetchSuggestions should cancel it
      expect(mockCancel).toHaveBeenCalled();
      unmount();
    });
  });
});
